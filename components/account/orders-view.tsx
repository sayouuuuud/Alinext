'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Package } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { useLanguage } from '@/lib/i18n/language-context'
import type { TrackingOrder } from '@/lib/commerce/types'
import { OrderCard } from './order-card'

type Filter = 'all' | 'active' | 'completed' | 'cancelled'

export function OrdersView({ orders }: { orders: TrackingOrder[] }) {
  const { locale } = useLanguage()
  const [filter, setFilter] = useState<Filter>('all')
  const ar = locale === 'ar'
  const filtered = useMemo(() => orders.filter((order) => filter === 'all' || (filter === 'active' ? !['completed', 'cancelled'].includes(order.status) : order.status === filter)), [filter, orders])
  const filters: Array<{ value: Filter; label: string }> = [
    { value: 'all', label: ar ? 'الكل' : 'All' },
    { value: 'active', label: ar ? 'نشطة' : 'Active' },
    { value: 'completed', label: ar ? 'مكتملة' : 'Completed' },
    { value: 'cancelled', label: ar ? 'ملغية' : 'Cancelled' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">ALI FLEET</p><h1 className="mt-4 text-balance font-serif text-4xl leading-tight tracking-tight text-foreground md:text-5xl">{ar ? 'طلباتي' : 'My orders'}</h1><p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">{ar ? 'تابع كل مرحلة وافتح تفاصيل الشحن والفاتورة والإجراءات المتاحة.' : 'Follow each stage and open shipping details, invoices, and available actions.'}</p></header>
      {orders.length ? <><div className="flex flex-wrap gap-2" role="group" aria-label={ar ? 'فلترة الطلبات' : 'Filter orders'}>{filters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} aria-pressed={filter === item.value} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filter === item.value ? 'bg-foreground text-background' : 'bg-card text-muted-foreground ring-1 ring-border hover:text-foreground'}`}>{item.label}</button>)}</div><div className="flex flex-col gap-4">{filtered.map((order) => <OrderCard key={order.id} order={order} />)}{!filtered.length ? <p className="rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-border">{ar ? 'لا توجد طلبات ضمن هذا التصنيف.' : 'No orders in this category.'}</p> : null}</div></> : <div className="rounded-3xl bg-card p-10 text-center ring-1 ring-border"><Package className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-serif text-xl">{ar ? 'لا توجد طلبات بعد' : 'No orders yet'}</p><LocaleLink href="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground">{ar ? 'تصفح قطع الغيار' : 'Browse parts'}<ArrowRight className="size-4 rtl:rotate-180" /></LocaleLink></div>}
    </div>
  )
}
