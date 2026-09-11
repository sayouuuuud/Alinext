'use client'

import { ArrowRight } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { useLanguage } from '@/lib/i18n/language-context'
import { localeMeta } from '@/lib/i18n/config'
import type { TrackingOrder } from '@/lib/commerce/types'
import { orderStatusLabel } from '@/lib/orders/status'

export function OrderStatusBadge({ status }: { status: TrackingOrder['status'] }) {
  const { locale } = useLanguage()
  const terminal = status === 'cancelled'
  return <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 ${terminal ? 'bg-destructive/10 text-destructive ring-destructive/30' : 'bg-accent/10 text-accent ring-accent/25'}`}>{orderStatusLabel(status, locale)}</span>
}

export function OrderCard({ order }: { order: TrackingOrder }) {
  const { locale } = useLanguage()
  const itemCount = order.items.reduce((sum, line) => sum + line.quantity, 0)
  const dateLocale = localeMeta[locale].htmlLang
  const ar = locale === 'ar'

  return (
    <article className="rounded-3xl bg-card p-5 ring-1 ring-border transition-shadow hover:shadow-md md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{ar ? 'رقم الطلب' : 'Order number'}</p><p className="mt-1 font-serif text-xl tracking-tight text-foreground">#{order.orderNumber}</p></div><OrderStatusBadge status={order.status} /></div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3"><div><dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{ar ? 'التاريخ' : 'Date'}</dt><dd className="mt-1 text-sm text-foreground">{new Date(order.createdAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })}</dd></div><div><dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{ar ? 'العناصر' : 'Items'}</dt><dd className="mt-1 text-sm text-foreground">{itemCount}</dd></div><div><dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{ar ? 'الإجمالي' : 'Total'}</dt><dd className="mt-1 text-sm font-medium text-foreground">{new Intl.NumberFormat('en', { style: 'currency', currency: order.currency }).format(order.totalMinor / 100)}</dd></div></dl>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4"><p className="min-w-0 truncate text-xs text-muted-foreground">{order.trackingNumber ? `${order.carrier || ''} · ${order.trackingNumber}` : ar ? 'تظهر معلومات الشحن بعد التجهيز' : 'Shipping details appear after processing'}</p><LocaleLink href={`/account/orders/${order.id}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent hover:underline">{ar ? 'عرض التفاصيل' : 'View details'}<ArrowRight className="size-4 rtl:rotate-180" /></LocaleLink></div>
    </article>
  )
}
