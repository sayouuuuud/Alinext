'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PackageCheck, Printer, RefreshCw, XCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { localizeHref } from '@/lib/i18n/routing'
import { cancelOrderAction, confirmOrderReceivedAction, reorderAction } from '@/lib/orders/actions'
import type { OrderStatus } from '@/lib/orders/status'

export function OrderActions({ orderId, status, invoiceHref }: { orderId: string; status: OrderStatus; invoiceHref: string }) {
  const { locale } = useLanguage()
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'cancel' | 'confirm' | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const ar = locale === 'ar'

  function open(modeValue: 'cancel' | 'confirm') {
    setMode(modeValue)
    setMessage('')
    dialogRef.current?.showModal()
  }

  function submit() {
    if (!mode) return
    if (mode === 'cancel' && reason.trim().length < 3) {
      setMessage(ar ? 'اكتب سببًا مختصرًا للإلغاء.' : 'Add a short cancellation reason.')
      return
    }
    startTransition(async () => {
      const result = mode === 'cancel'
        ? await cancelOrderAction({ orderId, reason })
        : await confirmOrderReceivedAction(orderId)
      if (!result.ok) {
        setMessage(ar ? 'تعذر تنفيذ العملية. حدّث الصفحة وتحقق من حالة الطلب.' : 'The action could not be completed. Refresh and check the order status.')
        return
      }
      dialogRef.current?.close()
      router.refresh()
    })
  }

  function reorder() {
    setMessage('')
    startTransition(async () => {
      const result = await reorderAction(orderId)
      if (!result.ok) {
        setMessage(ar ? 'لا توجد عناصر متاحة حاليًا لإعادة الطلب.' : 'No items are currently available to reorder.')
        return
      }
      router.push(localizeHref('/cart', locale))
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {status === 'pending' ? <button type="button" onClick={() => open('cancel')} className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"><XCircle className="size-4" />{ar ? 'إلغاء الطلب' : 'Cancel order'}</button> : null}
        {status === 'delivered' ? <button type="button" onClick={() => open('confirm')} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"><PackageCheck className="size-4" />{ar ? 'تأكيد الاستلام' : 'Confirm receipt'}</button> : null}
        <button type="button" onClick={reorder} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{ar ? 'اطلب مرة أخرى' : 'Order again'}</button>
        <a href={localizeHref(invoiceHref, locale)} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"><Printer className="size-4" />{ar ? 'الفاتورة والطباعة' : 'Invoice & print'}</a>
      </div>
      {message ? <p role="alert" className="mt-3 text-sm text-destructive">{message}</p> : null}

      <dialog ref={dialogRef} className="w-[min(92vw,30rem)] rounded-3xl bg-card p-0 text-foreground shadow-2xl backdrop:bg-foreground/50">
        <div className="p-6">
          <h2 className="font-serif text-2xl font-semibold">{mode === 'cancel' ? (ar ? 'إلغاء الطلب' : 'Cancel order') : (ar ? 'تأكيد استلام الطلب' : 'Confirm receipt')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode === 'cancel' ? (ar ? 'يمكن الإلغاء فقط قبل اعتماد الطلب. سيُعاد المخزون تلقائيًا.' : 'Cancellation is only available before confirmation. Inventory will be restored.') : (ar ? 'أكد فقط بعد استلام كل عناصر الطلب بحالة سليمة.' : 'Confirm only after receiving all order items.')}</p>
          {mode === 'cancel' ? <label className="mt-5 flex flex-col gap-2 text-sm font-medium">{ar ? 'سبب الإلغاء' : 'Cancellation reason'}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={500} className="rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" /></label> : null}
          {message ? <p role="alert" className="mt-3 text-sm text-destructive">{message}</p> : null}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">{ar ? 'رجوع' : 'Back'}</button>
            <button type="button" onClick={submit} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : null}{ar ? 'تأكيد' : 'Confirm'}</button>
          </div>
        </div>
      </dialog>
    </>
  )
}
