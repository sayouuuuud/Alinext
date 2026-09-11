'use client'

import Image from 'next/image'
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import type { PartSummary } from '@/lib/data/parts'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatPrice } from '@/lib/format'
import { proxied } from '@/lib/img-proxy'
import { whatsappLink } from '@/lib/site-config'
import { useStore } from '@/lib/store-context'
import { useAuth } from '@/lib/auth/auth-context'
import { createOrderAction } from '@/lib/commerce/actions'
import {
  idleCheckoutState,
  type CheckoutDefaults,
  type CheckoutErrorCode,
} from '@/lib/commerce/types'

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `checkout:${crypto.randomUUID()}`
  }
  return `checkout:${Date.now()}:${Math.random().toString(36).slice(2)}`
}

function checkoutError(code: CheckoutErrorCode, locale: 'ar' | 'en' | 'he') {
  const messages = {
    ar: {
      not_logged_in: 'يرجى تسجيل الدخول قبل إرسال الطلب.',
      invalid_fields: 'تحقق من بيانات التوصيل والكمية ثم حاول مجدداً.',
      email_unconfirmed: 'يرجى تأكيد بريدك الإلكتروني قبل إرسال الطلب.',
      product_unavailable: 'تغير المخزون أو الحد المتاح لأحد المنتجات. راجع السلة وحاول مجدداً.',
      order_failed: 'تعذر تسجيل الطلب الآن. لم يتم خصم أي مبلغ؛ حاول مرة أخرى.',
    },
    en: {
      not_logged_in: 'Please sign in before placing your order.',
      invalid_fields: 'Check the delivery details and quantities, then try again.',
      email_unconfirmed: 'Please confirm your email before placing an order.',
      product_unavailable: 'Stock or an item limit changed. Review your cart and try again.',
      order_failed: 'We could not place the order. No payment was taken; please try again.',
    },
    he: {
      not_logged_in: 'יש להתחבר לפני שליחת ההזמנה.',
      invalid_fields: 'בדקו את פרטי המשלוח והכמויות ונסו שוב.',
      email_unconfirmed: 'יש לאמת את כתובת האימייל לפני שליחת ההזמנה.',
      product_unavailable: 'המלאי או מגבלת הכמות השתנו. בדקו את הסל ונסו שוב.',
      order_failed: 'לא הצלחנו ליצור את ההזמנה. לא בוצע חיוב; נסו שוב.',
    },
  }
  return messages[locale][code]
}

export function CartView({
  catalog,
  checkoutDefaults,
}: {
  catalog: PartSummary[]
  checkoutDefaults: CheckoutDefaults
}) {
  const { t, locale } = useLanguage()
  const store = useStore()
  const { viewer, signedIn } = useAuth()
  const { lines, ready, syncing, syncError, setQuantity, remove, clear } = useCart()
  const router = useRouter()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod')
  const [state, formAction, pending] = useActionState(createOrderAction, idleCheckoutState)

  const rows = lines
    .map((line) => {
      const part = catalog.find((item) => item.slug === line.slug)
      return part ? { part, quantity: line.quantity } : null
    })
    .filter((row): row is { part: PartSummary; quantity: number } => row !== null)
  const subtotal = rows.reduce((total, row) => total + row.part.price * row.quantity, 0)

  useEffect(() => {
    if (state.status !== 'success') return
    clear()
    setIsCheckoutOpen(false)
    router.push(`/track-order?order=${encodeURIComponent(state.orderNumber)}`)
  }, [clear, router, state])

  const openCheckout = () => {
    setIdempotencyKey(newIdempotencyKey())
    setIsCheckoutOpen(true)
  }

  const whatsappHref = whatsappLink(
    [
      t.cart.whatsappIntro,
      ...rows.map(
        (row) =>
          `• ${row.part.name[locale]} (${row.part.sku}) × ${row.quantity} — ${formatPrice(
            row.part.price * row.quantity,
            store.currency,
          )}`,
      ),
      `${t.cart.subtotal}: ${formatPrice(subtotal, store.currency)}`,
    ].join('\n'),
    store.whatsapp,
  )

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
        <div className="flex flex-col items-center rounded-3xl bg-card p-12 text-center ring-1 ring-border md:p-20">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
            <ShoppingCart className="size-7 text-muted-foreground" aria-hidden="true" />
          </span>
          <h2 className="mt-6 font-serif text-2xl text-foreground md:text-3xl">{t.cart.empty}</h2>
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
        <div className="flex flex-col gap-4">
          {syncError ? (
            <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
              {locale === 'ar'
                ? 'تعذر حفظ السلة في حسابك. تحقق من المخزون وحاول تعديل الكمية.'
                : locale === 'he'
                  ? 'לא הצלחנו לשמור את הסל בחשבון. בדקו את המלאי ונסו לשנות את הכמות.'
                  : 'We could not save the cart to your account. Check stock and adjust the quantity.'}
            </p>
          ) : null}

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
                  <p className="text-sm font-semibold text-muted-foreground">
                    {part.brand} · {part.subcategoryName?.[locale] || part.categoryName[locale]}
                  </p>
                  <h3 className="mt-1.5 text-pretty text-base font-semibold leading-snug text-foreground">
                    <LocaleLink href={`/products/${part.slug}`} className="hover:text-accent">
                      {part.name[locale]}
                    </LocaleLink>
                  </h3>
                  <p className="mt-1 font-mono text-sm text-muted-foreground" dir="ltr">
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
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-foreground" aria-live="polite" dir="ltr">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(part.slug, quantity + 1)}
                      aria-label={`${t.common.quantity} +`}
                      className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
                    >
                      <Plus className="size-4" aria-hidden="true" />
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
          </ul>

          <div className="flex justify-between gap-4 px-1">
            <LocaleLink href="/products" className="text-sm font-medium text-accent hover:underline">
              {t.cart.continueShopping}
            </LocaleLink>
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              {t.cart.clearCart}
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-foreground">{t.cart.summary}</h2>
              {signedIn && syncing ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {locale === 'ar' ? 'حفظ السلة' : locale === 'he' ? 'שומר סל' : 'Saving cart'}
                </span>
              ) : null}
            </div>

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
              <p className="text-sm font-semibold text-muted-foreground">{t.cart.subtotal}</p>
              <p className="font-serif text-3xl text-foreground" dir="ltr">
                {formatPrice(subtotal, store.currency)}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {locale === 'ar'
                ? 'يُعاد احتساب الضريبة والشحن والمخزون بأمان عند تأكيد الطلب.'
                : locale === 'he'
                  ? 'המס, המשלוח והמלאי מחושבים מחדש באופן מאובטח בעת אישור ההזמנה.'
                  : 'Tax, shipping, and stock are securely recalculated when the order is confirmed.'}
            </p>

            {signedIn ? (
              <button
                type="button"
                onClick={openCheckout}
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-opacity hover:opacity-90"
              >
                <CheckCircle2 className="size-5" aria-hidden="true" />
                <span>{locale === 'ar' ? 'متابعة لإرسال الطلب' : locale === 'he' ? 'המשך לשליחת ההזמנה' : 'Continue to place order'}</span>
                <ArrowRight className="size-4" aria-hidden="true" data-flip-rtl />
              </button>
            ) : (
              <LocaleLink
                href="/account/login?redirectTo=/cart"
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="size-5" aria-hidden="true" />
                {locale === 'ar' ? 'سجّل الدخول لإتمام الطلب' : locale === 'he' ? 'התחברו להשלמת ההזמנה' : 'Sign in to place order'}
              </LocaleLink>
            )}

            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-full bg-secondary px-6 py-3.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-80"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t.cart.orderViaWhatsapp}
              </a>
            ) : null}
          </div>
        </aside>
      </div>

      {isCheckoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/60 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            aria-describedby="checkout-description"
            className="relative my-8 w-full max-w-xl rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border md:p-8"
          >
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={pending}
              aria-label={locale === 'ar' ? 'إغلاق' : locale === 'he' ? 'סגירה' : 'Close'}
              className="absolute end-5 top-5 flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 pe-12">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 id="checkout-title" className="font-serif text-xl text-foreground">
                  {locale === 'ar' ? 'تأكيد التوصيل والطلب' : locale === 'he' ? 'אישור משלוח והזמנה' : 'Confirm delivery and order'}
                </h3>
                <p id="checkout-description" className="mt-1 text-sm text-muted-foreground">
                  {viewer?.email}
                </p>
              </div>
            </div>

            <form action={formAction} className="mt-6 flex flex-col gap-5">
              <input type="hidden" name="items" value={JSON.stringify(rows.map(({ part, quantity }) => ({ slug: part.productId, quantity })))} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

              {state.status === 'error' ? (
                <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-destructive ring-1 ring-destructive/20">
                  {checkoutError(state.code, locale)}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground sm:col-span-2">
                  {locale === 'ar' ? 'اسم المستلم' : locale === 'he' ? 'שם המקבל' : 'Recipient name'}
                  <input
                    name="fullName"
                    required
                    autoComplete="name"
                    defaultValue={checkoutDefaults.fullName || viewer?.name || ''}
                    disabled={pending}
                    className="rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  {locale === 'ar' ? 'الهاتف' : locale === 'he' ? 'טלפון' : 'Phone'}
                  <input
                    name="phone"
                    type="tel"
                    dir="ltr"
                    required
                    autoComplete="tel"
                    defaultValue={checkoutDefaults.phone}
                    disabled={pending}
                    className="rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  {locale === 'ar' ? 'الرمز البريدي' : locale === 'he' ? 'מיקוד' : 'Postal code'}
                  <input
                    name="postalCode"
                    autoComplete="postal-code"
                    defaultValue={checkoutDefaults.postalCode}
                    disabled={pending}
                    className="rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground sm:col-span-2">
                  {locale === 'ar' ? 'العنوان' : locale === 'he' ? 'כתובת' : 'Street address'}
                  <input
                    name="street"
                    required
                    autoComplete="street-address"
                    defaultValue={checkoutDefaults.street}
                    disabled={pending}
                    className="rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  {locale === 'ar' ? 'المدينة' : locale === 'he' ? 'עיר' : 'City'}
                  <input
                    name="city"
                    required
                    autoComplete="address-level2"
                    defaultValue={checkoutDefaults.city}
                    disabled={pending}
                    className="rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  {locale === 'ar' ? 'الدولة' : locale === 'he' ? 'מדינה' : 'Country'}
                  <input
                    name="country"
                    required
                    autoComplete="country-name"
                    defaultValue={checkoutDefaults.country}
                    disabled={pending}
                    className="rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                  />
                </label>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="text-sm font-medium text-foreground">
                  {locale === 'ar' ? 'طريقة الدفع' : locale === 'he' ? 'אמצעי תשלום' : 'Payment method'}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 transition-colors ${paymentMethod === 'cod' ? 'bg-primary/10 text-primary ring-primary' : 'bg-background text-foreground ring-border'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      disabled={pending}
                      className="sr-only"
                    />
                    <Banknote className="size-5" aria-hidden="true" />
                    <span className="text-sm font-semibold">{locale === 'ar' ? 'الدفع عند الاستلام' : locale === 'he' ? 'תשלום במסירה' : 'Pay on delivery'}</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 transition-colors ${paymentMethod === 'bank_transfer' ? 'bg-primary/10 text-primary ring-primary' : 'bg-background text-foreground ring-border'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      disabled={pending}
                      className="sr-only"
                    />
                    <Building2 className="size-5" aria-hidden="true" />
                    <span className="text-sm font-semibold">{locale === 'ar' ? 'تحويل بنكي' : locale === 'he' ? 'העברה בנקאית' : 'Bank transfer'}</span>
                  </label>
                </div>
              </fieldset>

              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                {locale === 'ar' ? 'ملاحظات للطلب (اختياري)' : locale === 'he' ? 'הערות להזמנה (רשות)' : 'Order notes (optional)'}
                <textarea
                  name="customerNotes"
                  rows={3}
                  maxLength={1000}
                  disabled={pending}
                  className="resize-y rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                />
              </label>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary p-4">
                <span className="text-sm font-medium text-muted-foreground">{t.cart.subtotal}</span>
                <span className="font-serif text-xl text-foreground" dir="ltr">{formatPrice(subtotal, store.currency)}</span>
              </div>

              <button
                type="submit"
                disabled={pending || syncing || !idempotencyKey}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                {pending
                  ? locale === 'ar' ? 'جاري تسجيل الطلب...' : locale === 'he' ? 'יוצר הזמנה...' : 'Placing order...'
                  : locale === 'ar' ? 'تأكيد وإرسال الطلب' : locale === 'he' ? 'אישור ושליחת ההזמנה' : 'Confirm and place order'}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
