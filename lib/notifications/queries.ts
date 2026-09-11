import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

export type AccountNotification = {
  id: string
  orderId: string | null
  eventType: string
  payload: Json
  readAt: string | null
  createdAt: string
}

export async function loadNotifications(limit = 20) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { signedIn: false as const, notifications: [], unreadCount: 0 }

  const cappedLimit = Math.max(1, Math.min(limit, 100))
  const [listResult, countResult] = await Promise.all([
    supabase
      .from('notifications')
      .select('id,order_id,event_type,payload,read_at,created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(cappedLimit),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .is('read_at', null),
  ])

  if (listResult.error || countResult.error) throw new Error('notifications_unavailable')
  return {
    signedIn: true as const,
    notifications: (listResult.data || []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      eventType: row.event_type,
      payload: row.payload,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
    unreadCount: countResult.count || 0,
  }
}
