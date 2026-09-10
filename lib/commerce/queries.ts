import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import type {
  CartLine,
  CheckoutDefaults,
  TrackingOrder,
  TrackingOrdersResult,
} from './types'

const emptyCheckoutDefaults: CheckoutDefaults = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  country: 'Israel',
  postalCode: '',
}

function jsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function jsonString(value: Json | undefined) {
  return typeof value === 'string' ? value : ''
}

function localizedName(value: Json, fallback: string) {
  const map = jsonObject(value)
  return {
    ar: jsonString(map.ar) || jsonString(map.en) || jsonString(map.he) || fallback,
    en: jsonString(map.en) || jsonString(map.ar) || jsonString(map.he) || fallback,
    he: jsonString(map.he) || jsonString(map.en) || jsonString(map.ar) || fallback,
  }
}

export async function loadCartLines(): Promise<CartLine[]> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return []

  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (cartError || !cart) return []

  const { data: items, error: itemError } = await supabase
    .from('cart_items')
    .select('product_id,quantity')
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true })
  if (itemError) return []

  return (items || []).map((item) => ({
    slug: item.product_id,
    quantity: item.quantity,
  }))
}

export async function loadCheckoutDefaults(): Promise<CheckoutDefaults> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return emptyCheckoutDefaults

  const [profileResult, addressResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name,phone')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('addresses')
      .select('full_name,phone,street,city,country,postal_code')
      .eq('user_id', user.id)
      .eq('kind', 'shipping')
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const address = addressResult.data
  return {
    fullName: address?.full_name || profile?.display_name || '',
    phone: address?.phone || profile?.phone || '',
    street: address?.street || '',
    city: address?.city || '',
    country: address?.country || emptyCheckoutDefaults.country,
    postalCode: address?.postal_code || '',
  }
}

export async function loadTrackingOrders(limit = 50): Promise<TrackingOrdersResult> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData.user
  if (userError || !user) return { state: 'signed_out', orders: [] }

  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id,order_number,created_at,status,total_minor,currency,payment_method,payment_status,tracking_number,carrier,estimated_delivery,customer_name,customer_phone,shipping_address')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 100)))
  if (orderError) return { state: 'error', orders: [] }

  const orderIds = (orders || []).map((order) => order.id)
  if (!orderIds.length) return { state: 'ready', orders: [] }

  const [itemResult, historyResult] = await Promise.all([
    supabase
      .from('order_items')
      .select('id,order_id,product_id,product_name,sku,image,unit_price_minor,quantity,line_total_minor')
      .in('order_id', orderIds),
    supabase
      .from('order_status_history')
      .select('id,order_id,from_status,to_status,note,created_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: true }),
  ])
  if (itemResult.error || historyResult.error) return { state: 'error', orders: [] }

  const safeOrders: TrackingOrder[] = (orders || []).map((order) => {
    const address = jsonObject(order.shipping_address)
    return {
      id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      status: order.status,
      totalMinor: order.total_minor,
      currency: order.currency,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
      estimatedDelivery: order.estimated_delivery,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      shippingAddress: {
        fullName: jsonString(address.fullName) || order.customer_name,
        phone: jsonString(address.phone) || order.customer_phone,
        street: jsonString(address.street),
        city: jsonString(address.city),
        country: jsonString(address.country),
        postalCode: jsonString(address.postalCode),
      },
      items: (itemResult.data || [])
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: localizedName(item.product_name, item.sku),
          sku: item.sku,
          image: item.image,
          unitPriceMinor: item.unit_price_minor,
          quantity: item.quantity,
          lineTotalMinor: item.line_total_minor,
        })),
      history: (historyResult.data || [])
        .filter((entry) => entry.order_id === order.id)
        .map((entry) => ({
          id: entry.id,
          fromStatus: entry.from_status,
          toStatus: entry.to_status,
          note: entry.note,
          createdAt: entry.created_at,
        })),
    }
  })

  return { state: 'ready', orders: safeOrders }
}
