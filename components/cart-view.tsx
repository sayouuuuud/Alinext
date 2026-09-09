'use client'

import Image from 'next/image'
import LocaleLink from '@/components/locale-link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useAuth } from '@/lib/auth/auth-context' 
import { useFormStatus } from 'react-dom'
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Banknote,
  Building2,
  X,
} from 'lucide-react'
import type { PartSummary } from '@/lib/data/parts'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatPrice } from '@/lib/format'
import { proxied } from '@/lib/img-proxy'
import { whatsappLink } from '@/lib/site-config'
import { prepareCheckoutAction } from '@/lib/checkout/actions'
import { useStore } from '@/lib/store-context'
import { getStoredContent, saveContent } from '@/lib/admin/content-store'
import type { OrderRecord } from '@/lib/admin/types'

/**
 * The cart itself only ever stores slugs and quantities in localStorage, so the
 * catalog is passed in from the server page to resolve them into live products.
 * That means prices, stock and — critically — WooCommerce product ids are read
 * fresh instead of trusting whatever was cached in the browser.
 */
/**
 * Split into its own component because `useFormStatus` only reports the status
 * of the form it is rendered inside. Without a pending state the button stayed
 * clickable and silent while the server action rebuilt the WooCommerce basket,
 * which read as "nothing happened" (QA-06).
 */
function CheckoutSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-foreground px-6 py-4 text-base font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
        </>
      )}
    </button>
  )
}

export function CartView({ catalog }: { catalog: PartSummary[] }) {
  const { t, locale } = useLanguage()
  const { signedIn } = useAuth()
  const store = useStore()
  const { lines, count, ready, setQuantity, remove, clear } = useCart()
  const searchParams = useSearchParams()
  // The server action redirects back here with this flag when WooCommerce could
  // not be handed the basket, so the failure is visible instead of silent.
  const checkoutFailed = searchParams.get('checkout') === 'unavailable'
  // The /checkout route sends the customer back with this flag when the basket
  // no longer matches the WooCommerce session it handed off (QA-10).
  const checkoutExpired = searchParams.get('checkout') === 'expired'
  const router = useRouter()
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('باسم علي')
  const [customerPhone, setCustomerPhone] = useState('+972 50-891-2345')
  const [customerEmail, setCustomerEmail] = useState('basem.ali@gmail.com')
  const [customerAddress, setCustomerAddress] = useState('طريق القدس الرئيسي 25، الناصرة')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'bank_transfer'>('card')
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  // Auto-populate customer info if logged in
  useEffect(() => {
    try {
      const match = document.cookie.match(/alifleet_session_user=([^;]+)/)
      if (match && match[1]) {
        const user = JSON.parse(decodeURIComponent(match[1]))
        if (user.name) setCustomerName(user.name)
        if (user.email) setCustomerEmail(user.email)
        if (user.phone) setCustomerPhone(user.phone)
      }
    } catch {}
  }, [])

  const rows = lines
    .map((line) => {
      const part = catalog.find((item) => item.slug === line.slug)
      return part ? { part, quantity: line.quantity } : null
    })
    .filter((row): row is { part: PartSummary; quantity: number } => row !== null)

  const subtotal = rows.reduce((total, row) => total + row.part.price * row.quantity, 0)

  const handleCompleteDirectOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingOrder(true)

    try {
      const stored = getStoredContent()
      const newOrderId = `ORD-${Math.floor(7830 + Math.random() * 200)}`
      const trackingCode = `ARX-${Math.floor(78300000 + Math.random() * 999999)}IL`

      // Update customers
      const existingCustomers = stored.customers || []
      const customerIndex = existingCustomers.findIndex(
        (c) =>
          c.phone.replace(/[^0-9]/g, '') === customerPhone.replace(/[^0-9]/g, '') ||
          c.email.toLowerCase() === customerEmail.toLowerCase() ||
          c.name.includes(customerName)
      )

      let updatedCustomers = [...existingCustomers]
      const actualCustId =
        customerIndex >= 0 ? updatedCustomers[customerIndex].id : `cust-${Date.now()}`

      const newOrder: OrderRecord = {
        id: newOrderId,
        customerId: actualCustId,
        customerName: customerName.trim() || 'باسم علي',
        customerEmail: customerEmail.trim() || 'basem.ali@gmail.com',
        customerPhone: customerPhone.trim() || '+972 50-891-2345',
        date: new Date().toISOString(),
        status: 'confirmed',
        total: subtotal,
        currency: store.currency || '₪',
        paymentMethod,
        paymentStatus: 'paid',
        carrier: 'Aramex Freight Express',
        trackingNumber: trackingCode,
        estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        notes: `عملية شراء مباشرة لقطع غيار - تم الدفع بنجاح.`,
        shippingAddress: {
          street: customerAddress || 'طريق القدس الرئيسي 25',
          city: 'الناصرة',
          country: 'إسرائيل',
          postalCode: '16000',
        },
        items: rows.map((r) => ({
          id: r.part.slug,
          title: r.part.name[locale] || r.part.name.ar || r.part.slug,
          sku: r.part.sku,
          quantity: r.quantity,
          price: r.part.price,
          image: r.part.image,
        })),
      }

      if (customerIndex >= 0) {
        const existing = updatedCustomers[customerIndex]
        updatedCustomers[customerIndex] = {
          ...existing,
          totalSpent: (existing.totalSpent || 0) + subtotal,
          ordersCount: (existing.ordersCount || 0) + 1,
          orders: [
            {
              id: newOrderId,
              orderNumber: `#${newOrderId}`,
              date: new Date().toISOString().slice(0, 10),
              total: subtotal,
              status: 'confirmed',
              items: rows.map((r) => ({
                name: r.part.name[locale] || r.part.name.ar,
                quantity: r.quantity,
                price: r.part.price,
              })),
            },
            ...(existing.orders || []),
          ],
        }
      } else {
        updatedCustomers.unshift({
          id: `cust-${Date.now()}`,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          tier: 'Gold',
          status: 'active',
          joinedDate: new Date().toISOString().slice(0, 10),
          totalSpent: subtotal,
          ordersCount: 1,
          billingAddress: {
            street: customerAddress,
            city: 'الناصرة',
            country: 'إسرائيل',
          },
          shippingAddress: {
            street: customerAddress,
            city: 'الناصرة',
            country: 'إسرائيل',
          },
          orders: [
            {
              id: newOrderId,
              orderNumber: `#${newOrderId}`,
              date: new Date().toISOString().slice(0, 10),
              total: subtotal,
              status: 'confirmed',
              items: rows.map((r) => ({
                name: r.part.name[locale] || r.part.name.ar,
                quantity: r.quantity,
                price: r.part.price,
              })),
            },
          ],
        })
      }

      const updatedSiteContent = {
        ...stored,
        orders: [newOrder, ...(stored.orders || [])],
        customers: updatedCustomers,
      }

      saveContent(updatedSiteContent)
      clear()
      router.push(`/track-order?order=${newOrderId}`)
    } catch (err) {
      console.error(err)
      setIsSubmittingOrder(false)
    }
  }

  const checkoutItems = rows
    .map((row) => `${row.part.wooId}:${row.quantity}`)
    .join(',')
  const checkoutReady = Boolean(store.wordpress.baseUrl)

  const whatsappHref = whatsappLink(
    [
      t.cart.whatsappIntro,
      ...rows.map(
        (row) =>
          `• ${row.part.name[locale]} (${row.part.sku}) × ${row.quantity} — ${formatPrice(
            row.part.price * row.quantity,
            store.currency
          )}`
      ),
      `${t.cart.subtotal}: ${formatPrice(subtotal, store.currency)}`,
    ].join('\n'),
    store.whatsapp
  )

  // Avoid rendering an "empty cart" flash before localStorage is read.
  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        {/* Emptying the cart is the most common way to invalidate a handoff, so
            this explanation has to survive the empty state too. */}
        {checkoutExpired && (
          <p
            role="status"
            className="mb-6 flex items-start gap-2.5 rounded-2xl bg-muted p-4 text-sm leading-relaxed text-muted-foreground"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t.cart.checkoutExpired}
          </p>
        )}
        <div className="flex flex-col items-center rounded-3xl bg-card p-12 text-center ring-1 ring-border md:p-20">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
            <ShoppingCart className="size-7 text-muted-foreground" aria-hidden="true" />
          </span>
          <h2 className="mt-6 font-serif text-2xl text-foreground md:text-3xl">
            {t.cart.empty}
          </h2>
          <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
            {t.cart.emptyLead}
          </p>
          <LocaleLink
            href="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-base font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.cart.browseParts}
            <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
          </LocaleLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:gap-10">
        {/* Lines */}
        <ul className="flex flex-col gap-4">
          {rows.map(({ part, quantity }) => (
            <li
              key={part.slug}
              className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border sm:flex-row sm:items-center md:p-5"
            >
              <LocaleLink
                href={`/products/${part.slug}`}
                className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl bg-secondary sm:size-28 sm:aspect-auto"
              >
                <Image
                  src={proxied(part.image)}
                  alt={part.alt[locale]}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </LocaleLink>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {part.brand} · {t.products.categories[part.category]}
                </p>
                <h3 className="mt-1.5 text-pretty text-base font-semibold leading-snug text-foreground">
                  <LocaleLink href={`/products/${part.slug}`} className="hover:text-accent">
                    {part.name[locale]}
                  </LocaleLink>
                </h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">
                  {part.sku} · {formatPrice(part.price, store.currency)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-3">
                <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(part.slug, quantity - 1)}
                    aria-label={`${t.common.quantity} -`}
                    className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>
                  <span
                    className="min-w-8 text-center text-sm font-semibold text-foreground"
                    dir="ltr"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(part.slug, quantity + 1)}
                    aria-label={`${t.common.quantity} +`}
                    className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-serif text-xl text-foreground" dir="ltr">
                    {formatPrice(part.price * quantity, store.currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(part.slug)}
                    aria-label={`${t.common.remove}: ${part.name[locale]}`}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}

          <li className="flex justify-between gap-4 px-1">
            <LocaleLink
              href="/products"
              className="text-sm font-medium text-accent hover:underline"
            >
              {t.cart.continueShopping}
            </LocaleLink>
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              {t.cart.clearCart}
            </button>
          </li>
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-7">
            <h2 className="font-serif text-2xl text-foreground">{t.cart.summary}</h2>

            <dl className="mt-6 flex flex-col gap-3 border-b border-border pb-6">
              {rows.map(({ part, quantity }) => (
                <div key={part.slug} className="flex justify-between gap-4 text-sm">
                  <dt className="min-w-0 truncate text-muted-foreground">
                    {part.name[locale]} × <span dir="ltr">{quantity}</span>
                  </dt>
                  <dd className="shrink-0 font-medium text-foreground" dir="ltr">
                    {formatPrice(part.price * quantity, store.currency)}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t.cart.subtotal}
              </p>
              <p className="font-serif text-3xl text-foreground" dir="ltr">
                {formatPrice(subtotal, store.currency)}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t.cart.shippingNote}
            </p>

            {/* The server action rebuilds the WooCommerce basket, hands off the
                authenticated customer session, then redirects to /checkout on
                this same Next.js origin. */}
            {checkoutFailed && (
              <p
                role="alert"
                className="mt-6 flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-4 text-sm leading-relaxed text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t.cart.checkoutUnavailable}
              </p>
            )}

            {checkoutExpired && (
              <p
                role="status"
                className="mt-6 flex items-start gap-2.5 rounded-2xl bg-muted p-4 text-sm leading-relaxed text-muted-foreground"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t.cart.checkoutExpired}
              </p>
            )}

            {/* Direct Instant Checkout Button (Primary) */}
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(true)}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:opacity-95 cursor-pointer"
            >
              <CheckCircle2 className="size-5" />
              <span>{locale === 'ar' ? 'إتمام الطلب وتأكيد الشراء' : 'Complete Order & Pay'}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </button>

            {/* Optional WooCommerce Gateway if ready */}
            {checkoutReady && signedIn && (
              <form action={prepareCheckoutAction} className="mt-3">
                <input type="hidden" name="items" value={checkoutItems} />
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary py-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-card"
                >
                  <span>{locale === 'ar' ? 'الدفع عبر بوابة WooCommerce' : 'Pay via WooCommerce'}</span>
                </button>
              </form>
            )}

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-full bg-secondary px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t.cart.orderViaWhatsapp}
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* Direct Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 md:p-8 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute end-5 top-5 p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {locale === 'ar' ? 'إتمام شراء قطع الغيار' : 'Complete Spare Part Order'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' ? 'تسجيل العملية وتأكيد الشحن الفوري' : 'Instant order placement & verification'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCompleteDirectOrder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {locale === 'ar' ? 'اسم العميل' : 'Customer Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {locale === 'ar' ? 'رقم الهاتف' : 'Phone'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {locale === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'} *
                </label>
                <input
                  type="text"
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">
                  {locale === 'ar' ? 'طريقة الدفع المعتمدة' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="size-4" />
                    <span>{locale === 'ar' ? 'بطاقة ائتمان' : 'Card'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Banknote className="size-4" />
                    <span>{locale === 'ar' ? 'عند الاستلام' : 'COD'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building2 className="size-4" />
                    <span>{locale === 'ar' ? 'تحويل بنكي' : 'Wire'}</span>
                  </button>
                </div>
              </div>

              {/* Order total strip */}
              <div className="rounded-2xl bg-muted/60 border border-border p-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">{locale === 'ar' ? 'المبلغ المستحق:' : 'Total:'}</span>
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(subtotal, store.currency)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{locale === 'ar' ? 'جاري معالجة الطلب...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>{locale === 'ar' ? 'تأكيد العملية وإصدار الفاتورة' : 'Confirm Order & Issue Invoice'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
