'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { useSiteContent } from '@/lib/admin/site-content-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { useStore } from '@/lib/store-context'
import { formatPrice } from '@/lib/format'
import { proxied } from '@/lib/img-proxy'
import { whatsappLink } from '@/lib/site-config'
import type {
  TrackingOrder,
  TrackingOrdersResult,
  TrackingOrderStatus,
} from '@/lib/commerce/types'

const STATUS_STEPS: Array<{ key: TrackingOrderStatus; ar: string; en: string; he: string }> = [
  { key: 'pending', ar: 'تم استلام الطلب', en: 'Order placed', he: 'ההזמנה התקבלה' },
  { key: 'confirmed', ar: 'تم تأكيد الطلب', en: 'Order confirmed', he: 'ההזמנה אושרה' },
  { key: 'processing', ar: 'التجهيز والفحص', en: 'Processing and QA', he: 'הכנה ובדיקה' },
  { key: 'shipping', ar: 'قيد الشحن', en: 'In transit', he: 'במשלוח' },
  { key: 'delivered', ar: 'تم التوصيل', en: 'Delivered', he: 'נמסר' },
]

function normalizeIdentifier(value: string) {
  return value.trim().replace(/^#/, '').toUpperCase()
}

function statusStep(status: TrackingOrderStatus) {
  if (status === 'completed') return 5
  const index = STATUS_STEPS.findIndex((step) => step.key === status)
  return index >= 0 ? index + 1 : status === 'cancelled' ? -1 : 1
}

function statusLabel(status: TrackingOrderStatus, locale: 'ar' | 'en' | 'he') {
  const normalized = status === 'completed' ? 'delivered' : status
  const step = STATUS_STEPS.find((item) => item.key === normalized)
  if (step) return step[locale]
  if (status === 'cancelled') {
    return locale === 'ar' ? 'تم الإلغاء' : locale === 'he' ? 'בוטל' : 'Cancelled'
  }
  return status
}

function dateLocale(locale: 'ar' | 'en' | 'he') {
  return locale === 'ar' ? 'ar' : locale === 'he' ? 'he' : 'en'
}

function paymentLabel(method: string, locale: 'ar' | 'en' | 'he') {
  if (method === 'bank_transfer') {
    return locale === 'ar' ? 'تحويل بنكي' : locale === 'he' ? 'העברה בנקאית' : 'Bank transfer'
  }
  return locale === 'ar' ? 'الدفع عند الاستلام' : locale === 'he' ? 'תשלום במסירה' : 'Pay on delivery'
}

function OrderDetails({ order }: { order: TrackingOrder }) {
  const { locale } = useLanguage()
  const store = useStore()
  const currentStep = statusStep(order.status)
  const trackingCode = order.trackingNumber
  const [copied, setCopied] = useState(false)
  const supportMessage =
    locale === 'ar'
      ? `مرحباً علي فليت، أحتاج مساعدة بخصوص الطلب ${order.orderNumber}`
      : locale === 'he'
        ? `שלום ALI FLEET, אני צריך עזרה עם ההזמנה ${order.orderNumber}`
        : `Hello ALI FLEET, I need help with order ${order.orderNumber}`
  const whatsappHref = whatsappLink(supportMessage, store.whatsapp)

  const copyTracking = async () => {
    if (!trackingCode) return
    await navigator.clipboard.writeText(trackingCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border md:p-8">
        <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {order.orderNumber}
              </h2>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${order.status === 'cancelled' ? 'bg-destructive/10 text-destructive ring-destructive/20' : 'bg-primary/10 text-primary ring-primary/20'}`}>
                {order.status === 'cancelled' ? <AlertCircle className="size-4" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
                {statusLabel(order.status, locale)}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" aria-hidden="true" />
              {new Date(order.createdAt).toLocaleDateString(dateLocale(locale), { dateStyle: 'long' })}
            </p>
          </div>
          {order.estimatedDelivery ? (
            <div className="rounded-2xl bg-secondary px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'التسليم المتوقع' : locale === 'he' ? 'מסירה משוערת' : 'Estimated delivery'}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-foreground">
                <Truck className="size-4 text-primary" aria-hidden="true" />
                {new Date(order.estimatedDelivery).toLocaleDateString(dateLocale(locale), { dateStyle: 'medium' })}
              </p>
            </div>
          ) : null}
        </div>

        {order.status === 'cancelled' ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-destructive ring-1 ring-destructive/20">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-relaxed">
              {locale === 'ar'
                ? 'أُلغي هذا الطلب. تواصل مع فريق الدعم إذا كنت بحاجة إلى تفاصيل إضافية.'
                : locale === 'he'
                  ? 'ההזמנה בוטלה. צרו קשר עם התמיכה אם דרושים פרטים נוספים.'
                  : 'This order was cancelled. Contact support if you need more information.'}
            </p>
          </div>
        ) : (
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {STATUS_STEPS.map((step, index) => {
              const stepNumber = index + 1
              const done = currentStep >= stepNumber
              const current = currentStep === stepNumber
              return (
                <li key={step.key} className="flex items-center gap-3 md:flex-col md:text-center">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${done ? 'bg-primary text-primary-foreground ring-primary' : 'bg-secondary text-muted-foreground ring-border'} ${current ? 'outline-4 outline-primary/15' : ''}`}>
                    {done && !current ? <Check className="size-5" aria-hidden="true" /> : stepNumber}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step[locale]}</p>
                    {current ? (
                      <p className="mt-1 text-sm text-primary">
                        {locale === 'ar' ? 'المرحلة الحالية' : locale === 'he' ? 'שלב נוכחי' : 'Current stage'}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <div className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="size-4 text-primary" aria-hidden="true" />
              {locale === 'ar' ? 'شركة الشحن' : locale === 'he' ? 'חברת שילוח' : 'Carrier'}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {order.carrier || (locale === 'ar' ? 'لم تُعيّن بعد' : locale === 'he' ? 'טרם הוקצה' : 'Not assigned yet')}
            </p>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-sm text-muted-foreground">
              {locale === 'ar' ? 'رقم التتبع' : locale === 'he' ? 'מספר מעקב' : 'Tracking number'}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate font-mono text-sm font-bold text-foreground">
                {trackingCode || (locale === 'ar' ? 'غير متاح بعد' : locale === 'he' ? 'טרם זמין' : 'Not available yet')}
              </p>
              {trackingCode ? (
                <button
                  type="button"
                  onClick={copyTracking}
                  aria-label={locale === 'ar' ? 'نسخ رقم التتبع' : locale === 'he' ? 'העתקת מספר מעקב' : 'Copy tracking number'}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  {copied ? <Check className="size-4 text-accent" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                </button>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-sm text-muted-foreground">
              {locale === 'ar' ? 'الدفع' : locale === 'he' ? 'תשלום' : 'Payment'}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {paymentLabel(order.paymentMethod, locale)} · {order.paymentStatus === 'paid' ? (locale === 'ar' ? 'مدفوع' : locale === 'he' ? 'שולם' : 'Paid') : (locale === 'ar' ? 'غير مدفوع' : locale === 'he' ? 'טרם שולם' : 'Unpaid')}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border">
          <h3 className="flex items-center gap-2 font-serif text-xl text-foreground">
            <Package className="size-5 text-primary" aria-hidden="true" />
            {locale === 'ar' ? 'قطع الغيار في الطلب' : locale === 'he' ? 'פריטים בהזמנה' : 'Items in this order'}
          </h3>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                  {item.image ? (
                    <Image src={proxied(item.image)} alt={item.name[locale]} fill sizes="64px" className="object-cover" />
                  ) : (
                    <Package className="size-6 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name[locale]}</p>
                  <p className="mt-1 font-mono text-sm text-muted-foreground" dir="ltr">
                    {item.sku} · ×{item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-foreground" dir="ltr">
                  {formatPrice(item.lineTotalMinor / 100, order.currency === 'ILS' ? '₪' : order.currency)}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <span className="text-sm font-semibold text-muted-foreground">
              {locale === 'ar' ? 'إجمالي الطلب' : locale === 'he' ? 'סה״כ הזמנה' : 'Order total'}
            </span>
            <span className="font-serif text-xl text-primary" dir="ltr">
              {formatPrice(order.totalMinor / 100, order.currency === 'ILS' ? '₪' : order.currency)}
            </span>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              {locale === 'ar' ? 'عنوان التسليم' : locale === 'he' ? 'כתובת למשלוח' : 'Delivery address'}
            </h3>
            <address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
              <strong className="block text-foreground">{order.shippingAddress.fullName || order.customerName}</strong>
              <span className="block" dir="ltr">{order.shippingAddress.phone || order.customerPhone}</span>
              <span className="block">{[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.postalCode, order.shippingAddress.country].filter(Boolean).join(', ')}</span>
            </address>
          </section>

          <section className="rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Clock className="size-4 text-primary" aria-hidden="true" />
              {locale === 'ar' ? 'سجل الحالة' : locale === 'he' ? 'היסטוריית סטטוס' : 'Status history'}
            </h3>
            <ol className="mt-4 flex flex-col gap-4">
              {order.history.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{statusLabel(entry.toStatus, locale)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString(dateLocale(locale), { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <MessageCircle className="size-4" aria-hidden="true" />
              {locale === 'ar' ? 'هل تحتاج مساعدة؟' : locale === 'he' ? 'צריכים עזרה?' : 'Need help?'}
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              {whatsappHref ? (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              ) : null}
              {store.phone ? (
                <a href={`tel:${store.phone}`} className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2.5 text-sm font-semibold text-primary-foreground ring-1 ring-primary-foreground/25 transition-opacity hover:opacity-80">
                  <Phone className="size-4" aria-hidden="true" />
                  {store.phone}
                </a>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export function TrackOrderScreen({ tracking }: { tracking: TrackingOrdersResult }) {
  const { content, tStr } = useSiteContent()
  const { locale } = useLanguage()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const pageHeader = content.pages?.trackOrder
  const headerEyebrow = tStr(pageHeader?.eyebrow, locale) || (locale === 'ar' ? 'تتبع خاص وآمن' : locale === 'he' ? 'מעקב פרטי ומאובטח' : 'Private, secure tracking')
  const headerTitle = tStr(pageHeader?.title, locale) || (locale === 'ar' ? 'تتبع طلبك' : locale === 'he' ? 'מעקב אחר ההזמנה' : 'Track your order')
  const headerLead = tStr(pageHeader?.lead, locale) || (locale === 'ar' ? 'سجّل الدخول وابحث برقم الطلب الكامل لعرض آخر تحديثات الشحن.' : locale === 'he' ? 'התחברו וחפשו לפי מספר ההזמנה המלא כדי לראות עדכוני משלוח.' : 'Sign in and use the complete order number to see the latest delivery updates.')

  useEffect(() => {
    const order = searchParams.get('order')
    if (!order) return
    setQuery(order)
    setSubmittedQuery(order)
  }, [searchParams])

  const matchedOrder = useMemo(() => {
    if (tracking.state !== 'ready' || !submittedQuery) return null
    const normalized = normalizeIdentifier(submittedQuery)
    return tracking.orders.find((order) => normalizeIdentifier(order.orderNumber) === normalized || normalizeIdentifier(order.id) === normalized) || null
  }, [submittedQuery, tracking])

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittedQuery(query)
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-32 text-foreground">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Truck className="size-4" aria-hidden="true" />
            {headerEyebrow}
          </div>
          <h1 className="mt-5 text-balance font-serif text-4xl tracking-tight md:text-5xl">{headerTitle}</h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">{headerLead}</p>
        </header>

        {tracking.state === 'signed_out' ? (
          <section className="mx-auto mt-10 flex max-w-xl flex-col items-center rounded-3xl bg-card p-8 text-center shadow-xl ring-1 ring-border md:p-12">
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
              <ShieldCheck className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-serif text-2xl text-foreground">
              {locale === 'ar' ? 'سجّل الدخول لعرض طلباتك' : locale === 'he' ? 'התחברו כדי לראות את ההזמנות' : 'Sign in to view your orders'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {locale === 'ar' ? 'حمايةً لبياناتك، لا نعرض الطلبات عبر الهاتف أو البحث العام.' : locale === 'he' ? 'כדי להגן על המידע שלכם, הזמנות אינן מוצגות בחיפוש ציבורי.' : 'To protect your information, orders are never exposed through public or phone-number search.'}
            </p>
            <LocaleLink href="/account/login?redirectTo=/track-order" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {locale === 'ar' ? 'تسجيل الدخول' : locale === 'he' ? 'התחברות' : 'Sign in'}
              <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
            </LocaleLink>
          </section>
        ) : tracking.state === 'error' ? (
          <p role="alert" className="mx-auto mt-10 max-w-xl rounded-3xl bg-destructive/10 p-6 text-center text-sm text-destructive ring-1 ring-destructive/20">
            {locale === 'ar' ? 'تعذر تحميل طلباتك الآن. حاول تحديث الصفحة.' : locale === 'he' ? 'לא הצלחנו לטעון את ההזמנות. נסו לרענן את הדף.' : 'We could not load your orders. Please refresh the page.'}
          </p>
        ) : tracking.orders.length === 0 ? (
          <section className="mx-auto mt-10 flex max-w-xl flex-col items-center rounded-3xl bg-card p-8 text-center shadow-xl ring-1 ring-border md:p-12">
            <Package className="size-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-5 font-serif text-2xl text-foreground">{locale === 'ar' ? 'لا توجد طلبات بعد' : locale === 'he' ? 'אין עדיין הזמנות' : 'No orders yet'}</h2>
            <LocaleLink href="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {locale === 'ar' ? 'تصفح قطع الغيار' : locale === 'he' ? 'עיון בחלקי חילוף' : 'Browse parts'}
              <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
            </LocaleLink>
          </section>
        ) : (
          <>
            <form onSubmit={submitSearch} className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">{locale === 'ar' ? 'رقم الطلب' : locale === 'he' ? 'מספר הזמנה' : 'Order number'}</span>
                <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={locale === 'ar' ? 'مثال: AF-202609-000001' : locale === 'he' ? 'לדוגמה: AF-202609-000001' : 'Example: AF-202609-000001'}
                  autoComplete="off"
                  className="w-full rounded-2xl bg-card py-4 pe-4 ps-12 text-sm text-foreground shadow-lg ring-1 ring-border outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </label>
              <button type="submit" className="rounded-2xl bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90">
                {locale === 'ar' ? 'تتبع الآن' : locale === 'he' ? 'מעקב עכשיו' : 'Track now'}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">{locale === 'ar' ? 'طلباتك الأخيرة:' : locale === 'he' ? 'הזמנות אחרונות:' : 'Recent orders:'}</span>
              {tracking.orders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => {
                    setQuery(order.orderNumber)
                    setSubmittedQuery(order.orderNumber)
                  }}
                  className="rounded-full bg-card px-3 py-1.5 font-mono text-sm text-foreground ring-1 ring-border transition-colors hover:ring-primary"
                >
                  {order.orderNumber}
                </button>
              ))}
            </div>

            <div className="mt-8">
              {matchedOrder ? (
                <OrderDetails order={matchedOrder} />
              ) : submittedQuery ? (
                <section className="mx-auto max-w-xl rounded-3xl bg-card p-8 text-center shadow-xl ring-1 ring-border">
                  <Package className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
                  <h2 className="mt-4 font-serif text-2xl text-foreground">{locale === 'ar' ? 'لم نجد هذا الطلب في حسابك' : locale === 'he' ? 'ההזמנה לא נמצאה בחשבון' : 'Order not found in your account'}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{locale === 'ar' ? 'استخدم رقم الطلب الكامل كما يظهر في رسالة التأكيد.' : locale === 'he' ? 'השתמשו במספר ההזמנה המלא כפי שמופיע באישור.' : 'Use the complete order number shown in your confirmation.'}</p>
                </section>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
