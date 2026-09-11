'use client'

import { Printer } from 'lucide-react'
import type { TrackingOrder } from '@/lib/commerce/types'
import { useLanguage } from '@/lib/i18n/language-context'
import { orderStatusLabel } from '@/lib/orders/status'

function money(value: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value / 100)
}

function paymentLabel(value: string, locale: string) {
  const labels: Record<string, Record<string, string>> = {
    cod: { ar: 'الدفع عند الاستلام', en: 'Cash on delivery', he: 'תשלום בעת מסירה' },
    bank_transfer: { ar: 'تحويل بنكي', en: 'Bank transfer', he: 'העברה בנקאית' },
  }
  return labels[value]?.[locale] || value
}

export function InvoiceView({ order }: { order: TrackingOrder }) {
  const { locale } = useLanguage()
  const normalizedLocale = locale === 'en' || locale === 'he' ? locale : 'ar'
  const ar = normalizedLocale === 'ar'
  const labels = ar
    ? { invoice: 'فاتورة الطلب', customer: 'العميل', address: 'العنوان', order: 'الطلب', item: 'الصنف', quantity: 'الكمية', price: 'السعر', total: 'الإجمالي', subtotal: 'المجموع الفرعي', tax: 'الضريبة', shipping: 'الشحن', grand: 'الإجمالي النهائي', payment: 'طريقة الدفع', paymentStatus: 'حالة الدفع', notes: 'ملاحظات العميل', print: 'طباعة / حفظ PDF' }
    : { invoice: 'Order invoice', customer: 'Customer', address: 'Address', order: 'Order', item: 'Item', quantity: 'Qty', price: 'Price', total: 'Total', subtotal: 'Subtotal', tax: 'Tax', shipping: 'Shipping', grand: 'Grand total', payment: 'Payment method', paymentStatus: 'Payment status', notes: 'Customer notes', print: 'Print / save PDF' }

  return (
    <article className="mx-auto max-w-4xl bg-card p-6 text-foreground ring-1 ring-border print:max-w-none print:bg-background print:p-0 print:ring-0 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
        <div>
          <p className="text-sm font-black tracking-[0.2em]">ALI FLEET</p>
          <h1 className="mt-3 font-serif text-4xl">{labels.invoice}</h1>
          <p className="mt-2 text-sm text-muted-foreground">#{order.orderNumber}</p>
        </div>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background print:hidden">
          <Printer aria-hidden="true" />
          {labels.print}
        </button>
      </header>

      <section className="grid gap-6 border-b border-border py-8 sm:grid-cols-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{labels.customer}</h2>
          <p className="mt-2 text-sm font-semibold">{order.customerName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.customerEmail}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.customerPhone}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{labels.address}</h2>
          <p className="mt-2 text-sm leading-relaxed">{[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.country, order.shippingAddress.postalCode].filter(Boolean).join('، ')}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{labels.order}</h2>
          <p className="mt-2 text-sm">{new Date(order.createdAt).toLocaleDateString(normalizedLocale)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{orderStatusLabel(order.status, normalizedLocale)}</p>
        </div>
      </section>

      <div className="overflow-x-auto py-8">
        <table className="w-full min-w-[36rem] text-sm">
          <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"><th className="px-2 py-3 text-start">{labels.item}</th><th className="px-2 py-3 text-start">SKU</th><th className="px-2 py-3 text-center">{labels.quantity}</th><th className="px-2 py-3 text-end">{labels.price}</th><th className="px-2 py-3 text-end">{labels.total}</th></tr></thead>
          <tbody>{order.items.map((item) => <tr key={item.id} className="border-b border-border"><td className="px-2 py-4 font-medium">{item.name[normalizedLocale]}</td><td className="px-2 py-4 font-mono text-xs text-muted-foreground">{item.sku}</td><td className="px-2 py-4 text-center">{item.quantity}</td><td className="px-2 py-4 text-end">{money(item.unitPriceMinor, order.currency)}</td><td className="px-2 py-4 text-end font-semibold">{money(item.lineTotalMinor, order.currency)}</td></tr>)}</tbody>
        </table>
      </div>

      <footer className="ms-auto flex max-w-sm flex-col gap-3 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-8 text-sm"><span>{labels.subtotal}</span><span>{money(order.subtotalMinor, order.currency)}</span></div>
        <div className="flex items-center justify-between gap-8 text-sm"><span>{labels.tax}</span><span>{money(order.taxMinor, order.currency)}</span></div>
        <div className="flex items-center justify-between gap-8 text-sm"><span>{labels.shipping}</span><span>{money(order.shippingMinor, order.currency)}</span></div>
        <div className="flex items-center justify-between gap-8 border-t border-border pt-3 text-lg font-bold"><span>{labels.grand}</span><span>{money(order.totalMinor, order.currency)}</span></div>
        <p className="text-end text-xs text-muted-foreground">{labels.payment}: {paymentLabel(order.paymentMethod, normalizedLocale)} · {labels.paymentStatus}: {order.paymentStatus}</p>
      </footer>

      {order.customerNotes ? <section className="mt-8 border-t border-border pt-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{labels.notes}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{order.customerNotes}</p></section> : null}
    </article>
  )
}
