'use client'

import { useEffect, useId, useState } from 'react'
import useSWR from 'swr'
import { Bell, CheckCheck } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-context'
import type { AccountNotification } from '@/lib/notifications/queries'
import { notificationText } from '@/components/account/notification-center'

type Payload = { notifications: AccountNotification[]; unreadCount: number }

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('request_failed')
  return response.json() as Promise<Payload>
}

export function NotificationBell() {
  const { locale } = useLanguage()
  const [open, setOpen] = useState(false)
  // The header renders two bell instances (desktop + mobile, one hidden by
  // CSS). supabase-js reuses channels by topic, so each instance needs its
  // own topic — otherwise the second .on() throws "cannot add callbacks
  // after subscribe()".
  const channelId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { data, mutate } = useSWR<Payload>('/api/account/notifications?limit=5', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60_000,
  })

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`bell-notifications-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => mutate())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [mutate, channelId])

  async function openNotification(id: string) {
    await fetch('/api/account/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    }).catch(() => {})
    await mutate()
    setOpen(false)
  }

  const unread = data?.unreadCount || 0
  const items = data?.notifications || []

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
      >
        <Bell className="size-4" aria-hidden="true" />
        {unread ? (
          <span className="absolute end-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground">
            {Math.min(unread, 99)}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <section className="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-border">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <p className="text-sm font-bold">{locale === 'ar' ? `الإشعارات (${unread} غير مقروءة)` : `Notifications (${unread} unread)`}</p>
              <LocaleLink href="/account/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-accent hover:underline">
                {locale === 'ar' ? 'عرض الكل' : 'View all'}
              </LocaleLink>
            </header>
            {items.length ? (
              <ul className="max-h-80 overflow-y-auto">
                {items.map((notification) => (
                  <li key={notification.id}>
                    <LocaleLink
                      href={notification.orderId ? `/account/orders/${notification.orderId}` : '/account/notifications'}
                      onClick={() => void openNotification(notification.id)}
                      className={`flex items-start gap-3 px-5 py-3.5 text-start transition-colors hover:bg-secondary ${notification.readAt ? '' : 'bg-secondary/40'}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{notificationText(notification, locale)}</span>
                        <time className="mt-0.5 block text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString(locale === 'ar' ? 'ar' : locale)}
                        </time>
                      </span>
                      {!notification.readAt ? (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent">
                          <span className="sr-only">Unread</span>
                        </span>
                      ) : null}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                {locale === 'ar' ? 'لا توجد إشعارات بعد' : 'No notifications yet'}
              </p>
            )}
            {unread ? (
              <footer className="border-t border-border px-5 py-3">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/account/notifications', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ markAll: true }),
                    }).catch(() => {})
                    await mutate()
                  }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                >
                  <CheckCheck className="size-3.5" />
                  {locale === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                </button>
              </footer>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  )
}
