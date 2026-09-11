'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { Bell, Package } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-context'
import { orderStatusLabel, type OrderStatus } from '@/lib/orders/status'
import type { AccountNotification } from '@/lib/notifications/queries'

type NotificationResponse = {
  userId: string
  notifications: AccountNotification[]
  unreadCount: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('request_failed')
  return response.json() as Promise<NotificationResponse>
}

function payloadValue(payload: AccountNotification['payload'], key: string) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ''
  const value = payload[key]
  return typeof value === 'string' ? value : ''
}

export function NotificationBell() {
  const { locale } = useLanguage()
  const { data, mutate } = useSWR('/api/account/notifications?limit=5', fetcher, { revalidateOnFocus: true, refreshInterval: 60_000 })

  useEffect(() => {
    if (!data?.userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`notification-bell-${data.userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${data.userId}` }, () => mutate())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [data?.userId, mutate])

  const ar = locale === 'ar'
  const items = data?.notifications || []

  return (
    <details className="group relative">
      <summary aria-label={ar ? 'الإشعارات' : 'Notifications'} className="relative flex size-10 cursor-pointer list-none items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary [&::-webkit-details-marker]:hidden">
        <Bell aria-hidden="true" />
        {data?.unreadCount ? <span className="absolute end-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground">{Math.min(data.unreadCount, 99)}</span> : null}
      </summary>
      <div className="absolute end-0 top-12 w-80 rounded-2xl bg-card p-3 text-foreground shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-3 px-2 py-2"><p className="font-semibold">{ar ? 'آخر الإشعارات' : 'Recent notifications'}</p><span className="text-xs text-muted-foreground">{data?.unreadCount || 0} {ar ? 'غير مقروء' : 'unread'}</span></div>
        {items.length ? <ul className="flex flex-col gap-1">{items.slice(0, 3).map((notification) => {
          const status = payloadValue(notification.payload, 'status') as OrderStatus
          const number = payloadValue(notification.payload, 'orderNumber') || '—'
          const label = status && ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'completed', 'cancelled'].includes(status) ? orderStatusLabel(status, locale) : notification.eventType
          return <li key={notification.id}><LocaleLink href={notification.orderId ? `/account/orders/${notification.orderId}` : '/account/notifications'} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-accent"><Package aria-hidden="true" /></span><span className="min-w-0 text-sm"><span className="block truncate font-medium">#{number} · {label}</span><time className="mt-0.5 block text-xs text-muted-foreground" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleDateString(locale)}</time></span>{!notification.readAt ? <span className="mt-2 size-2 shrink-0 rounded-full bg-accent"><span className="sr-only">Unread</span></span> : null}</LocaleLink></li>
        })}</ul> : <p className="px-3 py-6 text-center text-sm text-muted-foreground">{ar ? 'لا توجد إشعارات بعد' : 'No notifications yet'}</p>}
        <LocaleLink href="/account/notifications" className="mt-2 block rounded-xl px-3 py-2 text-center text-sm font-semibold text-accent hover:bg-secondary">{ar ? 'عرض كل الإشعارات' : 'View all notifications'}</LocaleLink>
      </div>
    </details>
  )
}
