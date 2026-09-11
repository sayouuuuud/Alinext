import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { loadTrackingOrders } from '@/lib/commerce/queries'

export async function loadUserOrder(orderId: string) {
  const result = await loadTrackingOrders(1, orderId)
  if (result.state !== 'ready') return { state: result.state as 'signed_out' | 'error', order: null }
  const order = result.orders.find((entry) => entry.id === orderId)
  return order ? { state: 'ready' as const, order } : { state: 'not_found' as const, order: null }
}

export async function loadUserOrderByNumber(orderNumber: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('order_number', orderNumber)
    .maybeSingle()
  if (!data) return null
  return loadUserOrder(data.id)
}
