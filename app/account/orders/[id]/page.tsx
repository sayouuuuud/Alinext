import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CreditCard, MapPin, Package, Truck } from 'lucide-react'
import { loadUserOrder } from '@/lib/orders/queries'
import { orderStatusLabel } from '@/lib/orders/status'
import { OrderStatusTimeline } from '@/components/account/order-status-timeline'
import { OrderActions } from '@/components/account/order-actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Order details | ALI FLEET', robots: { index: false, follow: false } }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params
  const result = await loadUserOrder(id)
  if (result.state === 'signed_out') redirect(`/account/login?redirectTo=/account/orders/${encodeURIComponent(id)}`)
  if (result.state === 'not_found') notFound()
  if (result.state !== 'ready' || !result.order) return <div className="rounded-3xl bg-card p-8 ring-1 ring-border">تعذر تحميل الطلب حاليًا.</div>
  const order = result.order

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">ORDER #{order.orderNumber}</p><h1 className="mt-3 text-balance font-serif text-4xl tracking-tight">تفاصيل الطلب</h1><p className="mt-2 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('ar')}</p></div><span className="rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">{orderStatusLabel(order.status, 'ar')}</span></header>
      <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-3xl bg-card p-5 ring-1 ring-border"><Package className="size-5 text-accent" /><p className="mt-4 text-xs text-muted-foreground">العناصر</p><p className="mt-1 font-serif text-2xl">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p></div><div className="rounded-3xl bg-card p-5 ring-1 ring-border"><CreditCard className="size-5 text-accent" /><p className="mt-4 text-xs text-muted-foreground">الإجمالي</p><p className="mt-1 font-serif text-2xl">{new Intl.NumberFormat('en', { style: 'currency', currency: order.currency }).format(order.totalMinor / 100)}</p></div><div className="rounded-3xl bg-card p-5 ring-1 ring-border"><Truck className="size-5 text-accent" /><p className="mt-4 text-xs text-muted-foreground">الشحن</p><p className="mt-1 text-sm font-semibold">{order.carrier || 'لم يُحدد بعد'}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{order.trackingNumber || '—'}</p></div></section>
      <OrderActions orderId={order.id} status={order.status} invoiceHref={`/account/orders/${order.id}/invoice`} />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="rounded-3xl bg-card p-6 ring-1 ring-border"><h2 className="font-serif text-2xl">العناصر</h2><ul className="mt-5 flex flex-col gap-4">{order.items.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0"><div><p className="font-semibold">{item.name.ar}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{item.sku} · {item.quantity}×</p></div><p className="shrink-0 font-semibold">{new Intl.NumberFormat('en', { style: 'currency', currency: order.currency }).format(item.lineTotalMinor / 100)}</p></li>)}</ul></section><section className="rounded-3xl bg-card p-6 ring-1 ring-border"><h2 className="font-serif text-2xl">رحلة الطلب</h2><div className="mt-6"><OrderStatusTimeline status={order.status} history={order.history} /></div></section></div>
      <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-3xl bg-card p-6 ring-1 ring-border"><MapPin className="size-5 text-accent" /><h2 className="mt-4 font-serif text-xl">عنوان التسليم</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{[order.shippingAddress.fullName, order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.country, order.shippingAddress.postalCode].filter(Boolean).join('، ')}</p><p className="mt-2 text-sm">{order.shippingAddress.phone}</p></div><div className="rounded-3xl bg-card p-6 ring-1 ring-border"><CreditCard className="size-5 text-accent" /><h2 className="mt-4 font-serif text-xl">الدفع</h2><p className="mt-3 text-sm">{order.paymentMethod}</p><p className="mt-1 text-sm text-muted-foreground">{order.paymentStatus}</p>{order.estimatedDelivery ? <p className="mt-4 text-xs text-muted-foreground">الوصول المتوقع: {new Date(order.estimatedDelivery).toLocaleDateString('ar')}</p> : null}</div></section>
    </div>
  )
}
