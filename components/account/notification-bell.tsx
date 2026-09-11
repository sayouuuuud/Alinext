'use client'

import useSWR from 'swr'
import { Bell } from 'lucide-react'
import LocaleLink from '@/components/locale-link'

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('request_failed')
  return response.json() as Promise<{ unreadCount: number }>
}

export function NotificationBell() {
  const { data } = useSWR('/api/account/notifications?limit=5', fetcher, { revalidateOnFocus: true, refreshInterval: 60_000 })
  return (
    <LocaleLink href="/account/notifications" aria-label="Notifications" className="relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary">
      <Bell className="size-4" aria-hidden="true" />
      {data?.unreadCount ? <span className="absolute end-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground">{Math.min(data.unreadCount, 99)}</span> : null}
    </LocaleLink>
  )
}
