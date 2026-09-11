'use client'

import { Printer } from 'lucide-react'
import type { TrackingOrder } from '@/lib/commerce/types'
import { useLanguage } from '@/lib/i18n/language-context'
import { orderStatusLabel } from '@/lib/orders/status'

function money(value: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value / 100)
}

export function InvoiceView({ order }: { order: TrackingOrder }) {
  const { locale } = useLanguage()
  const ar = locale === 'ar'
  return (
    <article className="mx-auto max-w-4xl bg-card p-6 text-foreground ring-1 ring-border print:max-w-none print:bg-background print:p-0 print:ring-0 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
        <div><p className="text-sm font-black tracking-[0.2em]">ALI FLEET</p><h1 className="mt-3 font-serif text-4xl">{ar ? 'فاتورة الطلب' : 'Order invoice'}</h1><p className="mt-2 text-sm text-muted-foreground">#{order.orderNumber}</p></div>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background print:hidden"><Printer className="size-4" />{ar ? 'طباعة / حفظ PDF' : 'Print / save PDF'}</button>
      </header>
      <section className="grid gap-6 border-b border-border py-8 sm:grid-cols-3">
        <div><h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? 'العميل' : 'Customer'}</h2><p className="mt-2 text-sm font-semibold">{order.customerName}</p><p className="mt-1 text-sm text-muted-foreground">{order.customerPhone}</p></div>
        <div><h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? 'العنوان' : 'Address'}</h2><p className="mt-2 text-sm leading-relaxed">{[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.country, order.shippingAddress.postalCode].filter(Boolean).join('، ')}</p></div>
        <div><h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? 'الطلب' : 'Order'}</h2><p className="mt-2 text-sm">{new Date(order.createdAt).toLocaleDateString(ar ? 'ar' : locale)}</p><p className="mt-1 text-sm text-muted-foreground">{orderStatusLabel(order.status, locale)} · {order.paymentStatus}</p></div>
      </section>
      <div className="overflow-x-auto py-8"><table className="w-full min-w-[36rem] text-sm"><thead><tr className="border-b border-border text-start text-xs uppercase tracking-wider text-muted-foreground"><th className="px-2 py-3 text-start">{ar ? 'الصنف' : 'Item'}</th><th className="px-2 py-3 text-start">SKU</th><th className="px-2 py-3 text-center">{ar ? 'الكمية' : 'Qty'}</th><th className="px-2 py-3 text-end">{ar ? 'السعر' : 'Price'}</th><th className="px-2 py-3 text-end">{ar ? 'الإجمالي' : 'Total'}</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-b border-border"><td className="px-2 py-4 font-medium">{item.name[locale === 'en' || locale === 'he' ? locale : 'ar']}</td><td className="px-2 py-4 font-mono text-xs text-muted-foreground">{item.sku}</td><td className="px-2 py-4 text-center">{item.quantity}</td><td className="px-2 py-4 text-end">{money(item.unitPriceMinor, order.currency)}</td><td className="px-2 py-4 text-end font-semibold">{money(item.lineTotalMinor, order.currency)}</td></tr>)}</tbody></table></div>
      <footer className="ms-auto max-w-sm border-t border-border pt-5"><div className="flex items-center justify-between gap-8 text-lg font-bold"><span>{ar ? 'الإجمالي' : 'Grand total'}</span><span>{money(order.totalMinor, order.currency)}</span></div><p className="mt-2 text-end text-xs text-muted-foreground">{ar ? `طريقة الدفع: ${order.paymentMethod}` : `Payment method: ${order.paymentMethod}`}</p></footer>
    </article>
  )
}
