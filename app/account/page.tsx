import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadAccount } from '@/lib/auth/queries'
import { loadTrackingOrders } from '@/lib/commerce/queries'
import { loadNotifications } from '@/lib/notifications/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { DashboardView } from '@/components/account/dashboard-view'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My account | ALI FLEET', description: 'Your ALI FLEET account, orders and notifications.', robots: { index: false, follow: false } }

export default async function AccountPage() {
  const [data, tracking, notice] = await Promise.all([
    loadAccount(50),
    loadTrackingOrders(50),
    loadNotifications(5).catch(() => ({ signedIn: true as const, notifications: [], unreadCount: 0 })),
  ])
  if (data.state === 'error') {
    if (data.code === 'not_logged_in') redirect('/account/login?redirectTo=/account')
    return <AccountGuard code={data.code} />
  }
  return <DashboardView customer={data.customer} viewer={data.viewer} orders={tracking.state === 'ready' ? tracking.orders : []} notifications={notice.notifications} unreadCount={notice.unreadCount} />
}
