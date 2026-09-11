import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadTrackingOrders } from '@/lib/commerce/queries'
import { OrdersView } from '@/components/account/orders-view'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Order history | ALI FLEET', description: 'Review and manage your ALI FLEET orders.', robots: { index: false, follow: false } }

export default async function OrdersPage() {
  const result = await loadTrackingOrders(100)
  if (result.state === 'signed_out') redirect('/account/login?redirectTo=/account/orders')
  if (result.state === 'error') return <div className="rounded-3xl bg-card p-8 text-sm text-muted-foreground ring-1 ring-border">تعذر تحميل الطلبات حاليًا.</div>
  return <OrdersView orders={result.orders} />
}
