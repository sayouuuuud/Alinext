import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadAccount } from '@/lib/auth/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { DashboardView } from '@/components/account/dashboard-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My account | ALI FLEET',
  description: 'Your ALI FLEET account overview: recent orders, contact details and delivery addresses.',
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const data = await loadAccount(5)
  if (data.state === 'error') {
    if (data.code === 'not_logged_in') redirect('/account/login?redirectTo=/account')
    return <AccountGuard code={data.code} />
  }
  return <DashboardView customer={data.customer} viewer={data.viewer} />
}
