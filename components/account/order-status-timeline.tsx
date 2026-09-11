'use client'

import { Check, Circle, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { ORDER_STATUS_SEQUENCE, orderStatusDescription, orderStatusLabel, type OrderStatus } from '@/lib/orders/status'

export type TimelineEntry = {
  id: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  note: string | null
  createdAt: string
}

export function OrderStatusTimeline({ status, history }: { status: OrderStatus; history: TimelineEntry[] }) {
  const { locale } = useLanguage()
  const completed = new Set(history.map((entry) => entry.toStatus))
  completed.add(status)
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(status)
  const entries = status === 'cancelled' ? history.filter((entry) => entry.toStatus === 'cancelled') : history.filter((entry) => entry.toStatus !== 'cancelled')
  const eventByStatus = new Map(entries.map((entry) => [entry.toStatus, entry]))
  const statuses = status === 'cancelled' ? ['cancelled'] as OrderStatus[] : ORDER_STATUS_SEQUENCE

  return (
    <ol className="flex flex-col gap-0" aria-label={locale === 'ar' ? 'مراحل الطلب' : 'Order timeline'}>
      {statuses.map((step, index) => {
        const event = eventByStatus.get(step)
        const reached = status === 'completed' || completed.has(step) || (currentIndex >= index && currentIndex >= 0)
        const current = step === status
        return (
          <li key={step} className="relative flex gap-4 pb-7 last:pb-0">
            {index < statuses.length - 1 ? <span className="absolute start-[15px] top-8 h-[calc(100%-1rem)] w-px bg-border" aria-hidden="true" /> : null}
            <span className={`relative flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ${current ? 'bg-accent text-accent-foreground ring-accent' : reached ? 'bg-secondary text-foreground ring-border' : 'bg-background text-muted-foreground ring-border'}`}>
              {step === 'cancelled' ? <X className="size-4" aria-hidden="true" /> : reached ? <Check className="size-4" aria-hidden="true" /> : <Circle className="size-3" aria-hidden="true" />}
            </span>
            <div className="min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{orderStatusLabel(step, locale)}</h3>
                {current ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{locale === 'ar' ? 'الحالة الحالية' : 'Current'}</span> : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{orderStatusDescription(step, locale)}</p>
              {event ? <time className="mt-1 block text-xs text-muted-foreground" dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString(locale === 'ar' ? 'ar' : locale === 'he' ? 'he' : 'en')}</time> : null}
              {event?.note && !event.note.includes('customer_confirmed_receipt') ? <p className="mt-2 rounded-xl bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">{event.note}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
