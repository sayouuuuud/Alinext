'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/database.types'
import type {
  CartLine,
  CheckoutActionState,
  InquiryActionState,
} from './types'

const cartLineSchema = z.object({
  slug: z.string().trim().min(1).max(160),
  quantity: z.number().int().min(1).max(100),
})

const cartSchema = z.array(cartLineSchema).max(50)

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  street: z.string().trim().min(2).max(250),
  city: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().max(30),
  customerNotes: z.string().trim().max(1000),
  paymentMethod: z.enum(['cod', 'bank_transfer']),
  idempotencyKey: z.string().trim().min(12).max(120).regex(/^[a-zA-Z0-9:_-]+$/),
})

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(254),
  subject: z.enum(['parts', 'import', 'fleet', 'other']),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0),
})

type AppSupabaseClient = SupabaseClient<Database>

function normalizedLines(input: CartLine[]) {
  const quantities = new Map<string, number>()
  for (const line of input) {
    quantities.set(line.slug, Math.min(100, (quantities.get(line.slug) || 0) + line.quantity))
  }
  return [...quantities].map(([slug, quantity]) => ({ slug, quantity }))
}

async function activeCartId(supabase: AppSupabaseClient, userId: string) {
  const existing = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (existing.error) return null
  if (existing.data) return existing.data.id

  const created = await supabase
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('id')
    .single()
  if (!created.error) return created.data.id
  if (created.error.code !== '23505') return null

  const raced = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  return raced.data?.id || null
}

export async function saveCartAction(input: CartLine[]): Promise<{ status: 'saved' | 'signed_out' | 'error' }> {
  const parsed = cartSchema.safeParse(input)
  if (!parsed.success) return { status: 'error' }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return { status: 'signed_out' }

  const lines = normalizedLines(parsed.data)
  const cartId = await activeCartId(supabase, user.id)
  if (!cartId) return { status: 'error' }

  if (!lines.length) {
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId)
    return { status: error ? 'error' : 'saved' }
  }

  const productIds = lines.map((line) => line.slug)
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id,max_order_quantity,stock_quantity')
    .in('id', productIds)
  if (productError || products?.length !== productIds.length) return { status: 'error' }

  const productLimits = new Map((products || []).map((product) => [product.id, Math.min(product.max_order_quantity, product.stock_quantity)]))
  if (lines.some((line) => line.quantity > (productLimits.get(line.slug) || 0))) {
    return { status: 'error' }
  }

  const upsertResult = await supabase.from('cart_items').upsert(
    lines.map((line) => ({ cart_id: cartId, product_id: line.slug, quantity: line.quantity })),
    { onConflict: 'cart_id,product_id' },
  )
  if (upsertResult.error) return { status: 'error' }

  const { data: existing, error: existingError } = await supabase
    .from('cart_items')
    .select('product_id')
    .eq('cart_id', cartId)
  if (existingError) return { status: 'error' }

  const requested = new Set(productIds)
  const staleIds = (existing || []).map((item) => item.product_id).filter((id) => !requested.has(id))
  if (staleIds.length) {
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .in('product_id', staleIds)
    if (deleteError) return { status: 'error' }
  }

  return { status: 'saved' }
}

function checkoutError(message: string): CheckoutActionState {
  if (message.includes('authentication_required')) return { status: 'error', code: 'not_logged_in' }
  if (message.includes('email_confirmation_required')) return { status: 'error', code: 'email_unconfirmed' }
  if (message.includes('product_unavailable_or_quantity_exceeded') || message.includes('invalid_quantity')) {
    return { status: 'error', code: 'product_unavailable' }
  }
  if (message.includes('invalid_')) return { status: 'error', code: 'invalid_fields' }
  return { status: 'error', code: 'order_failed' }
}

export async function createOrderAction(
  _previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  let rawItems: unknown
  try {
    rawItems = JSON.parse(String(formData.get('items') || ''))
  } catch {
    return { status: 'error', code: 'invalid_fields' }
  }

  const items = cartSchema.safeParse(rawItems)
  const fields = checkoutSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    street: formData.get('street'),
    city: formData.get('city'),
    country: formData.get('country'),
    postalCode: formData.get('postalCode') || '',
    customerNotes: formData.get('customerNotes') || '',
    paymentMethod: formData.get('paymentMethod'),
    idempotencyKey: formData.get('idempotencyKey'),
  })
  if (!items.success || !fields.success || items.data.length === 0) {
    return { status: 'error', code: 'invalid_fields' }
  }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { status: 'error', code: 'not_logged_in' }

  const lines = normalizedLines(items.data)
  const address: Json = {
    fullName: fields.data.fullName,
    phone: fields.data.phone,
    street: fields.data.street,
    city: fields.data.city,
    country: fields.data.country,
    postalCode: fields.data.postalCode,
  }
  const { data, error } = await supabase.rpc('create_order', {
    p_items: lines.map((line) => ({ product_id: line.slug, quantity: line.quantity })),
    p_address: address,
    p_idempotency_key: fields.data.idempotencyKey,
    p_customer_notes: fields.data.customerNotes || undefined,
    p_payment_method: fields.data.paymentMethod,
  })
  if (error) return checkoutError(error.message)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { status: 'error', code: 'order_failed' }
  }

  const orderNumber = data.orderNumber
  if (typeof orderNumber !== 'string' || !orderNumber) {
    return { status: 'error', code: 'order_failed' }
  }

  revalidatePath('/cart')
  revalidatePath('/account/orders')
  revalidatePath('/track-order')
  return { status: 'success', orderNumber }
}

export async function submitInquiryAction(
  _previous: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  const parsed = inquirySchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
    website: formData.get('website') || '',
  })
  if (!parsed.success) return { status: 'error', code: 'invalid_fields' }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const kind = parsed.data.subject === 'parts' ? 'product' : parsed.data.subject === 'import' ? 'import' : 'contact'
  const { error } = await createAdminClient().from('inquiries').insert({
    user_id: userData.user?.id || null,
    kind,
    entity_id: null,
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone,
    service: parsed.data.subject,
    message: parsed.data.message,
  })
  if (error) return { status: 'error', code: 'submit_failed' }

  revalidatePath('/admin')
  return { status: 'success' }
}
