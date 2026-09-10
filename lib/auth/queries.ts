import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { emptyAddress, type AccountData, type CustomerAddress, type CustomerOrder, type OrderStatus, type Viewer } from './types'
import type { Json } from '@/lib/supabase/database.types'

function numericId(value: string) {
  return Number.parseInt(value.replace(/-/g, '').slice(0, 8), 16) || 0
}

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts.shift() || '', lastName: parts.join(' ') }
}

function localized(value: Json, fallback: string) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const map = value as Record<string, Json | undefined>
    for (const locale of ['ar', 'en', 'he']) {
      if (typeof map[locale] === 'string' && map[locale]) return map[locale]
    }
  }
  return fallback
}

function money(minor: number) {
  return `₪${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function accountStatus(status: string): OrderStatus {
  if (status === 'completed' || status === 'delivered') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'pending') return 'pending'
  return 'processing'
}

function toAddress(row: {
  full_name: string
  company: string | null
  street: string
  address_line_2: string | null
  city: string
  state: string | null
  postal_code: string | null
  country: string
  phone: string
}, email = ''): CustomerAddress {
  const name = splitName(row.full_name)
  return {
    ...name,
    company: row.company || '',
    address1: row.street,
    address2: row.address_line_2 || '',
    city: row.city,
    state: row.state || '',
    postcode: row.postal_code || '',
    country: row.country,
    phone: row.phone,
    email,
  }
}

export async function loadAccount(orderLimit = 20): Promise<AccountData> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData.user
  if (userError || !user) return { state: 'error', code: 'not_logged_in' }

  const [profileResult, addressResult, orderResult] = await Promise.all([
    supabase.from('profiles').select('id,email,display_name,username,phone,created_at').eq('id', user.id).single(),
    supabase.from('addresses').select('id,kind,full_name,company,street,address_line_2,city,state,postal_code,country,phone,is_default').eq('user_id', user.id).order('is_default', { ascending: false }),
    supabase.from('orders').select('id,order_number,created_at,status,total_minor,subtotal_minor,tax_minor,shipping_minor,payment_method,payment_status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(orderLimit),
  ])

  if (profileResult.error || addressResult.error || orderResult.error || !profileResult.data) {
    return { state: 'error', code: 'unknown' }
  }

  const orders = orderResult.data || []
  const orderIds = orders.map((order) => order.id)
  const itemResult = orderIds.length
    ? await supabase.from('order_items').select('order_id,product_id,product_name,sku,quantity,line_total_minor').in('order_id', orderIds)
    : { data: [], error: null }
  if (itemResult.error) return { state: 'error', code: 'unknown' }

  const mappedOrders: CustomerOrder[] = orders.map((order) => ({
    databaseId: numericId(order.id),
    orderNumber: order.order_number,
    date: order.created_at,
    status: accountStatus(order.status),
    total: money(order.total_minor),
    subtotal: money(order.subtotal_minor),
    totalTax: money(order.tax_minor),
    shippingTotal: money(order.shipping_minor),
    paymentMethodTitle: order.payment_method === 'bank_transfer' ? 'Bank transfer — unpaid' : 'Pay on delivery — unpaid',
    lines: (itemResult.data || []).filter((item) => item.order_id === order.id).map((item) => ({
      name: localized(item.product_name, item.sku),
      slug: item.product_id,
      quantity: item.quantity,
      total: money(item.line_total_minor),
    })),
  }))

  const profile = profileResult.data
  const metadataFirst = typeof user.user_metadata.first_name === 'string' ? user.user_metadata.first_name : ''
  const metadataLast = typeof user.user_metadata.last_name === 'string' ? user.user_metadata.last_name : ''
  const fallbackName = splitName(profile.display_name)
  const firstName = metadataFirst || fallbackName.firstName
  const lastName = metadataLast || fallbackName.lastName
  const billingRow = addressResult.data?.find((address) => address.kind === 'billing')
  const shippingRow = addressResult.data?.find((address) => address.kind === 'shipping')
  const billing = billingRow ? toAddress(billingRow, profile.email) : { ...emptyAddress(), email: profile.email }
  const shipping = shippingRow ? toAddress(shippingRow) : emptyAddress()

  const viewer: Viewer = {
    databaseId: numericId(user.id),
    username: profile.username || profile.email.split('@')[0],
    email: profile.email,
    firstName,
    lastName,
    name: profile.display_name || `${firstName} ${lastName}`.trim(),
    registeredDate: profile.created_at,
  }

  return {
    state: 'ready',
    viewer,
    customer: {
      databaseId: numericId(user.id),
      email: profile.email,
      firstName,
      lastName,
      displayName: profile.display_name || viewer.name,
      date: profile.created_at,
      billing,
      shipping,
      orders: mappedOrders,
    },
  }
}

export async function loadViewer(): Promise<Viewer | null> {
  const data = await loadAccount(0)
  return data.state === 'ready' ? data.viewer : null
}
