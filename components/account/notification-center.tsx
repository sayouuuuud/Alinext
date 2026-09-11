'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { Bell, CheckCheck, Package } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-context'
import { orderStatusLabel, type OrderStatus } from '@/lib/orders/status'
import type { AccountNotification } from '@/lib/notifications/queries'

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('request_failed')
  return response.json() as Promise<{ userId: string; notifications: AccountNotification[]; unreadCount: number }>
}

function payloadValue(payload: AccountNotification['payload'], key: string) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ''
  const value = payload[key]
  return typeof value === 'string' ? value : ''
}

export function notificationText(notification: AccountNotification, locale: string) {
  const status = payloadValue(notification.payload, 'status') as OrderStatus
  const number = payloadValue(notification.payload, 'orderNumber')
  const label = status && ['pending','confirmed','processing','shipping','delivered','completed','cancelled'].includes(status) ? orderStatusLabel(status, locale) : notification.eventType
  return locale === 'ar' ? `الطلب #${number || '—'}: ${label}` : `Order #${number || '—'}: ${label}`
}

export function NotificationCenter() {
  const { locale } = useLanguage()
  const { data, error, isLoading, mutate } = useSWR('/api/account/notifications?limit=100', fetcher, { revalidateOnFocus: true })

  useEffect(() => {
    if (!data?.userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`account-notifications-${data.userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${data.userId}` }, () => mutate())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [data?.userId, mutate])

  async function markAll() {
    await fetch('/api/account/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) })
    await mutate()
  }

  function markOne(notification: AccountNotification) {
    if (notification.readAt) return
    void fetch('/api/account/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: notification.id }),
      keepalive: true,
    })
    void mutate((current) => current ? {
      ...current,
      unreadCount: Math.max(0, current.unreadCount - 1),
      notifications: current.notifications.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item),
    } : current, { revalidate: false })
  }

  if (isLoading) return <div className="rounded-3xl bg-card p-8 text-sm text-muted-foreground ring-1 ring-border">{locale === 'ar' ? 'جاري تحميل الإشعارات…' : 'Loading notifications…'}</div>
  if (error) return <div className="rounded-3xl bg-card p-8 text-sm text-muted-foreground ring-1 ring-border">{locale === 'ar' ? 'تعذر تحميل الإشعارات حاليًا. حاول مرة أخرى.' : 'Notifications are temporarily unavailable. Please try again.'}</div>
  const notifications = data?.notifications || []

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">ALI FLEET</p>
          <h1 className="mt-3 text-balance font-serif text-4xl tracking-tight text-foreground">{locale === 'ar' ? 'الإشعارات' : 'Notifications'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{locale === 'ar' ? `${data?.unreadCount || 0} إشعارات غير مقروءة` : `${data?.unreadCount || 0} unread notifications`}</p>
        </div>
        {data?.unreadCount ? <button type="button" onClick={markAll} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"><CheckCheck className="size-4" />{locale === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}</button> : null}
      </div>
      {notifications.length ? <ul className="flex flex-col gap-3">{notifications.map((notification) => <li key={notification.id}><LocaleLink href={notification.orderId ? `/account/orders/${notification.orderId}` : '/account/notifications'} onClick={() => markOne(notification)} className={`flex items-start gap-4 rounded-3xl p-5 ring-1 ring-border transition-colors hover:bg-secondary ${notification.readAt ? 'bg-background' : 'bg-card'}`}><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-accent"><Package className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{notificationText(notification, locale)}</span><time className="mt-1 block text-xs text-muted-foreground" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString(locale === 'ar' ? 'ar' : locale)}</time></span>{!notification.readAt ? <span className="mt-2 size-2 rounded-full bg-accent"><span className="sr-only">Unread</span></span> : null}</LocaleLink></li>)}</ul> : <div className="rounded-3xl bg-card p-10 text-center ring-1 ring-border"><Bell className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-serif text-xl">{locale === 'ar' ? 'لا توجد إشعارات بعد' : 'No notifications yet'}</p></div>}
    </section>
  )
}
