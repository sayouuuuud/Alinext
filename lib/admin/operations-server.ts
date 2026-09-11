import 'server-only'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminPermission } from '@/lib/admin/session-server'
import type { Json } from '@/lib/supabase/database.types'

const uuidSchema = z.string().uuid()
const listSchema = z.object({
  q: z.string().trim().max(100).default(''),
  status: z.enum(['all', 'active', 'suspended', 'pending']).default('all'),
  tier: z.enum(['all', 'Regular', 'Gold', 'Platinum', 'VIP']).default('all'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(10).max(100).default(20),
  sort: z.enum(['joined', 'orders', 'spent', 'activity']).default('joined'),
})

export type AdminUserListItem = {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string | null
  status: string
  tier: string
  joinedAt: string
  ordersCount: number
  totalSpentMinor: number
  lastOrderAt: string | null
}

function safeSearch(value: string) {
  return value.replace(/[%_,.()]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function listAdminUsers(input: unknown) {
  await requireAdminPermission('dashboard.read')
  const parsed = listSchema.parse(input)
  const admin = createAdminClient()
  const memberships = await admin.from('admin_memberships').select('user_id')
  if (memberships.error) throw new Error('users_unavailable')
  const adminIds = (memberships.data || []).map((entry) => entry.user_id)

  let query = admin
    .from('profiles')
    .select('id,email,display_name,phone,avatar_url,status,tier,created_at', { count: 'exact' })
  if (adminIds.length) query = query.not('id', 'in', `(${adminIds.join(',')})`)
  if (parsed.status !== 'all') query = query.eq('status', parsed.status)
  if (parsed.tier !== 'all') query = query.eq('tier', parsed.tier)
  const search = safeSearch(parsed.q)
  if (search) query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  const from = (parsed.page - 1) * parsed.limit
  const profiles = await query.order('created_at', { ascending: false }).range(from, from + parsed.limit - 1)
  if (profiles.error) throw new Error('users_unavailable')

  const ids = (profiles.data || []).map((profile) => profile.id)
  const orderResult = ids.length
    ? await admin.from('orders').select('user_id,total_minor,status,created_at').in('user_id', ids).is('archived_at', null)
    : { data: [], error: null }
  if (orderResult.error) throw new Error('users_unavailable')

  const users: AdminUserListItem[] = (profiles.data || []).map((profile) => {
    const orders = (orderResult.data || []).filter((order) => order.user_id === profile.id)
    return {
      id: profile.id,
      name: profile.display_name,
      email: profile.email,
      phone: profile.phone || '',
      avatarUrl: profile.avatar_url,
      status: profile.status,
      tier: profile.tier,
      joinedAt: profile.created_at,
      ordersCount: orders.length,
      totalSpentMinor: orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total_minor, 0),
      lastOrderAt: orders.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at || null,
    }
  })
  if (parsed.sort === 'orders') users.sort((a, b) => b.ordersCount - a.ordersCount)
  if (parsed.sort === 'spent') users.sort((a, b) => b.totalSpentMinor - a.totalSpentMinor)
  if (parsed.sort === 'activity') users.sort((a, b) => (b.lastOrderAt || '').localeCompare(a.lastOrderAt || ''))

  return { users, page: parsed.page, limit: parsed.limit, total: profiles.count || 0, pages: Math.max(1, Math.ceil((profiles.count || 0) / parsed.limit)) }
}

export async function getAdminUserDetail(rawId: unknown) {
  await requireAdminPermission('dashboard.read')
  const id = uuidSchema.parse(rawId)
  const admin = createAdminClient()
  const membership = await admin.from('admin_memberships').select('user_id').eq('user_id', id).maybeSingle()
  if (membership.data) throw new Error('admin_account_hidden')

  const profile = await admin.from('profiles').select('id,email,display_name,username,phone,preferred_locale,avatar_url,status,tier,interested_in,admin_notes,created_at,updated_at').eq('id', id).maybeSingle()
  if (profile.error) throw new Error('user_unavailable')
  if (!profile.data) return null

  const [addresses, orders, payments, audit] = await Promise.all([
    admin.from('addresses').select('id,label,kind,full_name,phone,company,street,address_line_2,city,state,country,postal_code,is_default,created_at').eq('user_id', id).order('is_default', { ascending: false }),
    admin.from('orders').select('id,order_number,status,total_minor,currency,payment_status,payment_method,tracking_number,carrier,estimated_delivery,created_at').eq('user_id', id).order('created_at', { ascending: false }),
    admin.from('payment_events').select('id,order_id,from_status,to_status,amount_minor,currency,payment_method,changed_by,note,created_at').eq('user_id', id).order('created_at', { ascending: false }),
    admin.from('admin_audit_log').select('id,actor_id,action,entity_type,entity_id,before_value,after_value,created_at').eq('entity_id', id).order('created_at', { ascending: false }).limit(100),
  ])
  if (addresses.error || orders.error || payments.error || audit.error) throw new Error('user_unavailable')

  const orderIds = (orders.data || []).map((order) => order.id)
  const [items, history] = orderIds.length ? await Promise.all([
    admin.from('order_items').select('id,order_id,product_name,sku,quantity,line_total_minor').in('order_id', orderIds),
    admin.from('order_status_history').select('id,order_id,from_status,to_status,note,changed_by,created_at').in('order_id', orderIds).order('created_at', { ascending: false }),
  ]) : [{ data: [], error: null }, { data: [], error: null }]
  if (items.error || history.error) throw new Error('user_unavailable')

  return { profile: profile.data, addresses: addresses.data || [], orders: orders.data || [], payments: payments.data || [], audit: audit.data || [], items: items.data || [], history: history.data || [] }
}

const profileUpdateSchema = z.object({
  tier: z.enum(['Regular', 'Gold', 'Platinum', 'VIP']).optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
  interestedIn: z.string().trim().max(500).nullable().optional(),
  adminNotes: z.string().trim().max(4000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'empty_update' })

export async function updateAdminUser(rawId: unknown, input: unknown) {
  const session = await requireAdminPermission('operations.write')
  const id = uuidSchema.parse(rawId)
  const patch = profileUpdateSchema.parse(input)
  const admin = createAdminClient()
  const membership = await admin.from('admin_memberships').select('user_id').eq('user_id', id).maybeSingle()
  if (membership.data) throw new Error('admin_account_protected')
  const before = await admin.from('profiles').select('tier,status,interested_in,admin_notes').eq('id', id).maybeSingle()
  if (!before.data) return null

  if (patch.status) {
    const { error: authError } = await admin.auth.admin.updateUserById(id, { ban_duration: patch.status === 'suspended' ? '876000h' : 'none' })
    if (authError) throw new Error('auth_update_failed')
  }
  const values = {
    ...(patch.tier ? { tier: patch.tier } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.interestedIn !== undefined ? { interested_in: patch.interestedIn } : {}),
    ...(patch.adminNotes !== undefined ? { admin_notes: patch.adminNotes } : {}),
  }
  const updated = await admin.from('profiles').update(values).eq('id', id).select('id,email,display_name,phone,status,tier,interested_in,admin_notes,updated_at').single()
  if (updated.error) throw new Error('profile_update_failed')
  await admin.from('admin_audit_log').insert({ actor_id: session.userId, action: patch.status ? `customer.${patch.status}` : 'customer.updated', entity_type: 'customer', entity_id: id, before_value: before.data as Json, after_value: updated.data as unknown as Json })
  return updated.data
}

const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']).optional(),
  carrier: z.string().trim().max(120).nullable().optional(),
  trackingNumber: z.string().trim().max(160).nullable().optional(),
  estimatedDelivery: z.string().date().nullable().optional(),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'empty_update' })

export async function updateAdminOrder(rawId: unknown, input: unknown) {
  const session = await requireAdminPermission('operations.write')
  const orderId = uuidSchema.parse(rawId)
  const patch = orderUpdateSchema.parse(input)
  const admin = createAdminClient()
  const result = await admin.rpc('admin_update_order', {
    p_order_id: orderId,
    p_status: patch.status,
    p_payment_status: patch.paymentStatus,
    p_carrier: patch.carrier,
    p_tracking_number: patch.trackingNumber,
    p_estimated_delivery: patch.estimatedDelivery,
    p_admin_notes: patch.adminNotes,
    p_note: patch.note,
    p_changed_by: session.userId,
  })
  if (result.error) throw new Error(result.error.message.includes('invalid_order_transition') ? 'invalid_order_transition' : result.error.message.includes('shipping_details_required') ? 'shipping_details_required' : 'order_update_failed')
  await admin.from('admin_audit_log').insert({ actor_id: session.userId, action: 'order.updated', entity_type: 'order', entity_id: orderId, after_value: patch as unknown as Json })
  return result.data
}

export async function listAdminOrders() {
  await requireAdminPermission('dashboard.read')
  const admin = createAdminClient()
  const orders = await admin.from('orders').select('id,order_number,user_id,customer_name,customer_email,customer_phone,shipping_address,total_minor,currency,status,payment_status,payment_method,tracking_number,carrier,estimated_delivery,customer_notes,admin_notes,created_at,updated_at').is('archived_at', null).order('created_at', { ascending: false }).limit(200)
  if (orders.error) throw new Error('orders_unavailable')
  const ids = (orders.data || []).map((order) => order.id)
  const [items, history] = ids.length ? await Promise.all([
    admin.from('order_items').select('id,order_id,product_name,sku,image,quantity,unit_price_minor,line_total_minor').in('order_id', ids),
    admin.from('order_status_history').select('id,order_id,from_status,to_status,note,changed_by,created_at').in('order_id', ids).order('created_at', { ascending: true }),
  ]) : [{ data: [], error: null }, { data: [], error: null }]
  if (items.error || history.error) throw new Error('orders_unavailable')
  return { orders: orders.data || [], items: items.data || [], history: history.data || [] }
}
