import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadAccount } from '@/lib/auth/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { OrdersView } from '@/components/account/orders-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Order history | ALI FLEET',
  description: 'Review every spare parts order you have placed with ALI FLEET.',
  robots: { index: false, follow: false },
}

export default async function OrdersPage() {
  const data = await loadAccount(50)
  if (data.state === 'error') {
    if (data.code === 'not_logged_in') redirect('/account/login?redirectTo=/account/orders')
    return <AccountGuard code={data.code} />
  }
  return <OrdersView orders={data.customer.orders} />
}
