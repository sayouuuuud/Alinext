'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const orderIdSchema = z.string().uuid()
const cancelSchema = z.object({ orderId: orderIdSchema, reason: z.string().trim().min(3).max(500) })

function refreshOrderPaths(orderId: string) {
  revalidatePath('/account')
  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)
  revalidatePath('/account/notifications')
  revalidatePath('/cart')
}

export async function cancelOrderAction(input: { orderId: string; reason: string }) {
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid_input' }
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false as const, error: 'not_authenticated' }

  const { error } = await supabase.rpc('cancel_order', {
    p_order_id: parsed.data.orderId,
    p_reason: parsed.data.reason,
  })
  if (error) return { ok: false as const, error: 'cancel_not_allowed' }
  refreshOrderPaths(parsed.data.orderId)
  return { ok: true as const }
}

export async function confirmOrderReceivedAction(orderId: string) {
  const parsed = orderIdSchema.safeParse(orderId)
  if (!parsed.success) return { ok: false as const, error: 'invalid_input' }
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false as const, error: 'not_authenticated' }

  const { error } = await supabase.rpc('confirm_order_received', { p_order_id: parsed.data })
  if (error) return { ok: false as const, error: 'confirmation_not_allowed' }
  refreshOrderPaths(parsed.data)
  return { ok: true as const }
}

export async function reorderAction(orderId: string) {
  const parsed = orderIdSchema.safeParse(orderId)
  if (!parsed.success) return { ok: false as const, error: 'invalid_input', unavailable: [] as string[] }
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false as const, error: 'not_authenticated', unavailable: [] as string[] }

  const { data: order } = await supabase.from('orders').select('id').eq('id', parsed.data).eq('user_id', userData.user.id).maybeSingle()
  if (!order) return { ok: false as const, error: 'not_found', unavailable: [] as string[] }

  const { data: oldItems, error: itemError } = await supabase
    .from('order_items')
    .select('product_id,sku,quantity')
    .eq('order_id', parsed.data)
  if (itemError || !oldItems?.length) return { ok: false as const, error: 'empty_order', unavailable: [] as string[] }

  const productIds = oldItems.flatMap((item) => item.product_id ? [item.product_id] : [])
  const { data: products, error: productError } = productIds.length
    ? await supabase.from('products').select('id,sku,stock_quantity,max_order_quantity,published,archived_at').in('id', productIds)
    : { data: [], error: null }
  if (productError) return { ok: false as const, error: 'products_unavailable', unavailable: [] as string[] }

  const current = new Map((products || []).map((product) => [product.id, product]))
  const available = oldItems.flatMap((item) => {
    const product = item.product_id ? current.get(item.product_id) : undefined
    if (!product || !product.published || product.archived_at || product.stock_quantity < 1) return []
    return [{ productId: product.id, quantity: Math.min(item.quantity, product.stock_quantity, product.max_order_quantity) }]
  })
  const unavailable = oldItems.filter((item) => !available.some((line) => line.productId === item.product_id)).map((item) => item.sku)
  if (!available.length) return { ok: false as const, error: 'products_unavailable', unavailable }

  let { data: cart } = await supabase.from('carts').select('id').eq('user_id', userData.user.id).eq('status', 'active').maybeSingle()
  if (!cart) {
    const created = await supabase.from('carts').insert({ user_id: userData.user.id, status: 'active' }).select('id').single()
    if (created.error) return { ok: false as const, error: 'cart_unavailable', unavailable }
    cart = created.data
  }

  const { data: existing } = await supabase.from('cart_items').select('product_id,quantity').eq('cart_id', cart.id)
  const existingQuantities = new Map((existing || []).map((item) => [item.product_id, item.quantity]))
  const rows = available.map((line) => {
    const product = current.get(line.productId)!
    return {
      cart_id: cart!.id,
      product_id: line.productId,
      quantity: Math.min((existingQuantities.get(line.productId) || 0) + line.quantity, product.stock_quantity, product.max_order_quantity),
    }
  })
  const { error: upsertError } = await supabase.from('cart_items').upsert(rows, { onConflict: 'cart_id,product_id' })
  if (upsertError) return { ok: false as const, error: 'cart_unavailable', unavailable }

  refreshOrderPaths(parsed.data)
  return { ok: true as const, unavailable }
}
