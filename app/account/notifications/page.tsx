import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationCenter } from '@/components/account/notification-center'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Notifications | ALI FLEET', robots: { index: false, follow: false } }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/account/login?redirectTo=/account/notifications')
  return <NotificationCenter />
}
