import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { loadTrackingOrders } from '@/lib/commerce/queries'

export async function loadUserOrder(orderId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { state: 'signed_out' as const, order: null }

  // Direct ownership-checked query: works regardless of how many orders the
  // user has, and RLS/ownership guarantees no IDOR.
  const { data: order, error } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (error) return { state: 'error' as const, order: null }
  if (!order) return { state: 'not_found' as const, order: null }

  const result = await loadTrackingOrders(100)
  if (result.state !== 'ready') return { state: result.state as 'signed_out' | 'error', order: null }
  const full = result.orders.find((entry) => entry.id === orderId)
  return full ? { state: 'ready' as const, order: full } : { state: 'not_found' as const, order: null }
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
