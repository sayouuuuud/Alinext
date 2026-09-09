'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Copy,
  Check,
  Phone,
  MessageCircle,
  Calendar,
  CreditCard,
  Building2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { useSiteContent } from '@/lib/admin/site-content-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { useSearchParams } from 'next/navigation'
import type { OrderRecord, OrderStatus } from '@/lib/admin/types'

const STATUS_STEPS: { key: OrderStatus; labelAr: string; labelEn: string; labelHe: string; step: number }[] = [
  { key: 'pending', labelAr: 'تم استلام الطلب', labelEn: 'Order Placed', labelHe: 'ההזמנה התקבלה', step: 1 },
  { key: 'confirmed', labelAr: 'تم تأكيد الطلب', labelEn: 'Order Confirmed', labelHe: 'אושר במלאي', step: 2 },
  { key: 'processing', labelAr: 'التجهيز والفحص', labelEn: 'Processing & QA', labelHe: 'בהכנה ובדיקה', step: 3 },
  { key: 'shipping', labelAr: 'قيد الشحن والتوصيل', labelEn: 'In Transit', labelHe: 'במשלוח והפצה', step: 4 },
  { key: 'delivered', labelAr: 'تم التوصيل بنجاح', labelEn: 'Delivered', labelHe: 'נמסר בהצלחה', step: 5 },
]

export function TrackOrderScreen() {
  const { content, tStr } = useSiteContent()
  const { locale } = useLanguage()
  const lang = locale
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('ORD-7830')
  const [copied, setCopied] = useState(false)

  // The page header is admin-editable (pages.trackOrder); the built-in
  // trilingual strings stay as the fallback.
  const pageHeader = content?.pages?.trackOrder
  const headerEyebrow =
    tStr(pageHeader?.eyebrow, lang) ||
    (lang === 'ar' ? 'نظام التتبع المباشر' : lang === 'he' ? 'מערכת מעקב בזמן אמת' : 'Live Order Tracking')
  const headerTitle =
    tStr(pageHeader?.title, lang) ||
    (lang === 'ar' ? 'تتبع شحنتك وطلبك بكل دقة' : lang === 'he' ? 'מעקב אחר ההזמנה והמשלוח שלך' : 'Track Your Shipment & Order')
  const headerLead =
    tStr(pageHeader?.lead, lang) ||
    (lang === 'ar'
      ? 'أدخل رقم الطلب أو رقم الهاتف للاطلاع على خط سير الشحنة وتفاصيل التوصيل لحظة بلحظة.'
      : lang === 'he'
      ? 'הזן את מספר ההזמנה או מספר הטלפון כדי לצפות בסטטוס המשלוח בזמן אמת.'
      : 'Enter your order ID or phone number to view real-time delivery status and courier updates.')

  React.useEffect(() => {
    const urlOrder = searchParams.get('order')
    if (urlOrder) {
      setSearchQuery(urlOrder)
    }
  }, [searchParams])

  const isRtl = lang === 'ar' || lang === 'he'

  // Look for order
  const matchedOrder = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.trim().toLowerCase().replace('#', '')
    const orders = content?.orders || []
    return (
      orders.find((o) => {
        const idVal = (o?.id || '').toLowerCase()
        const numVal = ((o as any)?.orderNumber || '').toLowerCase()
        const phoneVal = (o?.customerPhone || '').toLowerCase()
        const emailVal = (o?.customerEmail || '').toLowerCase()
        const nameVal = (o?.customerName || '').toLowerCase()

        return (
          idVal.includes(q) ||
          numVal.includes(q) ||
          idVal.replace(/[^0-9]/g, '').includes(q) ||
          phoneVal.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')) ||
          emailVal.includes(q) ||
          nameVal.includes(q)
        )
      }) || null
    )
  }, [searchQuery, content?.orders])

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          label: lang === 'ar' ? 'تم التوصيل' : lang === 'he' ? 'נמסר' : 'Delivered',
          icon: CheckCircle2,
        }
      case 'shipping':
        return {
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          label: lang === 'ar' ? 'في طريق التوصيل' : lang === 'he' ? 'במשלוח' : 'In Transit',
          icon: Truck,
        }
      case 'processing':
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          label: lang === 'ar' ? 'قيد التجهيز والفحص' : lang === 'he' ? 'בהכנה' : 'Processing',
          icon: Clock,
        }
      case 'confirmed':
        return {
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          label: lang === 'ar' ? 'تم التأكيد' : lang === 'he' ? 'אושר' : 'Confirmed',
          icon: ShieldCheck,
        }
      case 'cancelled':
        return {
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          label: lang === 'ar' ? 'تم الإلغاء' : lang === 'he' ? 'בוטל' : 'Cancelled',
          icon: AlertCircle,
        }
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
          label: lang === 'ar' ? 'بانتظار المراجعة' : lang === 'he' ? 'ממתין' : 'Pending',
          icon: Clock,
        }
    }
  }

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 1
      case 'confirmed':
        return 2
      case 'processing':
        return 3
      case 'shipping':
        return 4
      case 'delivered':
        return 5
      case 'cancelled':
        return -1
      default:
        return 1
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background pt-32 pb-24 text-foreground">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Truck className="size-4" />
            <span>{headerEyebrow}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {headerTitle}
          </h1>
          <p className="mt-3 text-muted-foreground text-sm md:text-base">
            {headerLead}
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative flex items-center shadow-lg rounded-2xl bg-card border border-border p-2 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <Search className="size-5 text-muted-foreground ms-3 me-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'أدخل رقم الطلب (مثال: ORD-7821) أو رقم هاتفك...'
                  : lang === 'he'
                  ? 'הזן מספר הזמנה (למשל ORD-7821) או טלפון...'
                  : 'Enter order number (e.g. ORD-7821) or phone...'
              }
              className="w-full bg-transparent border-none text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-hidden py-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {lang === 'ar' ? 'مسح' : 'Clear'}
              </button>
            )}
            <button
              onClick={() => {}}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              {lang === 'ar' ? 'تتبع الآن' : lang === 'he' ? 'עקוב עכשיו' : 'Track Now'}
            </button>
          </div>

          {/* Quick sample buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>{lang === 'ar' ? 'نماذج جاهزة للتجربة:' : 'Try sample orders:'}</span>
            {(content?.orders || []).slice(0, 5).map((o) => {
              const displayId = o.id || (o as any).orderNumber || 'ORD'
              return (
                <button
                  key={o.id}
                  onClick={() => setSearchQuery(displayId)}
                  className="px-2.5 py-1 rounded-full bg-card border border-border/80 text-foreground font-mono hover:border-primary transition-colors text-[11px]"
                >
                  #{displayId} ({o.status})
                </button>
              )
            })}
          </div>
        </div>

        {/* Results Container */}
        {matchedOrder ? (
          <div className="space-y-6">
            {/* Card 1: Order Status & Stepper */}
            <div className="rounded-3xl bg-card border border-border/80 shadow-xl p-6 md:p-8 overflow-hidden relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-foreground">
                      #{matchedOrder.id || (matchedOrder as any).orderNumber}
                    </h2>
                    {(() => {
                      const badge = getStatusBadge(matchedOrder.status)
                      const Icon = badge.icon
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
                          <Icon className="size-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      )
                    })()}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                    <Calendar className="size-3.5" />
                    <span>
                      {lang === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}{' '}
                      {matchedOrder.date
                        ? new Date(matchedOrder.date).toLocaleDateString()
                        : (matchedOrder as any).createdAt || '2026-09-08'}
                    </span>
                  </p>
                </div>

                {matchedOrder.estimatedDelivery && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-2.5 text-right md:text-end">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      {lang === 'ar' ? 'التسليم المتوقع' : 'Estimated Delivery'}
                    </div>
                    <div className="text-sm font-bold text-primary flex items-center gap-1.5 mt-0.5 justify-end">
                      <Truck className="size-4" />
                      <span>{matchedOrder.estimatedDelivery}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cancelled Notice or Stepper */}
              {matchedOrder.status === 'cancelled' ? (
                <div className="my-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3">
                  <AlertCircle className="size-6 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">
                      {lang === 'ar' ? 'تم إلغاء هذا الطلب' : 'This order has been cancelled'}
                    </div>
                    <div className="text-xs mt-0.5">
                      {lang === 'ar'
                        ? 'يرجى التواصل مع خدمة عملاء علي فليت لأي استفسار أو استرداد للمبلغ.'
                        : 'Please contact ALI FLEET customer support for refund assistance.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <div className="relative">
                    {/* Progress Bar Background */}
                    <div className="hidden md:block absolute top-5 inset-x-8 h-1 bg-muted rounded-full" />
                    {/* Progress Bar Active */}
                    {(() => {
                      const currentStep = getStepIndex(matchedOrder.status)
                      const progressPct = ((currentStep - 1) / (STATUS_STEPS.length - 1)) * 100
                      return (
                        <div
                          className="hidden md:block absolute top-5 start-8 h-1 bg-primary rounded-full transition-all duration-700"
                          style={{ width: `calc(${progressPct}% - 3rem)` }}
                        />
                      )
                    })()}

                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2">
                      {STATUS_STEPS.map((s, idx) => {
                        const currentStep = getStepIndex(matchedOrder.status)
                        const isDone = currentStep >= s.step
                        const isCurrent = currentStep === s.step
                        const label = lang === 'ar' ? s.labelAr : lang === 'he' ? s.labelHe : s.labelEn

                        return (
                          <div key={s.key} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2 relative z-10">
                            <div
                              className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                isCurrent
                                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-lg shadow-primary/25'
                                  : isDone
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}
                            >
                              {isDone && !isCurrent ? <Check className="size-5" /> : s.step}
                            </div>
                            <div className="flex-1 md:flex-none">
                              <div className={`text-xs md:text-sm font-semibold ${isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {label}
                              </div>
                              {isCurrent && (
                                <div className="text-[11px] text-primary/80 font-medium">
                                  {lang === 'ar' ? 'المرحلة الحالية' : 'Current Stage'}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Carrier & Tracking Code Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-6 border-t border-border">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    <span>{lang === 'ar' ? 'شركة الشحن' : 'Carrier'}</span>
                  </div>
                  <div className="font-semibold text-sm text-foreground mt-1">
                    {matchedOrder.carrier || (lang === 'ar' ? 'علي فليت إكسبريس' : 'ALI FLEET Express')}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="size-3.5 text-primary" />
                    <span>{lang === 'ar' ? 'رقم بوليصة الشحن' : 'Tracking Code'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-xs md:text-sm font-bold text-foreground">
                      {matchedOrder.trackingNumber || 'AF-TRK-782190'}
                    </span>
                    <button
                      onClick={() => copyTracking(matchedOrder.trackingNumber || 'AF-TRK-782190')}
                      title="نسخ رقم الشحنة"
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-primary" />
                    <span>{lang === 'ar' ? 'حالة الدفع' : 'Payment'}</span>
                  </div>
                  <div className="font-semibold text-sm text-foreground mt-1 flex items-center gap-2">
                    <span>{matchedOrder.paymentMethod}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">
                      {matchedOrder.paymentStatus === 'paid' ? (lang === 'ar' ? 'مدفوع' : 'Paid') : (lang === 'ar' ? 'بانتظار التحصيل' : 'Pending')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Two-column Details (Items + Shipping Details) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Items (2 cols) */}
              <div className="lg:col-span-2 rounded-3xl bg-card border border-border/80 shadow-xl p-6">
                <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Package className="size-4 text-primary" />
                  <span>{lang === 'ar' ? 'المنتجات المطلوبة في الشحنة' : 'Items in Shipment'}</span>
                  <span className="text-xs font-normal text-muted-foreground">({matchedOrder.items.length})</span>
                </h3>

                <div className="divide-y divide-border">
                  {matchedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex items-center gap-3.5">
                      <div className="size-16 rounded-xl bg-muted/50 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {(item as any).title || (item as any).name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lang === 'ar' ? 'الكمية:' : 'Qty:'} <span className="font-semibold text-foreground">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="text-end font-bold text-sm text-foreground">
                        {matchedOrder.currency || '₪'} {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm font-bold">
                  <span>{lang === 'ar' ? 'المجموع الكلي' : 'Total Amount'}</span>
                  <span className="text-lg text-primary">
                    {matchedOrder.currency || '₪'} {(matchedOrder.total ?? (matchedOrder as any).totalAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Shipping Address & Direct Help (1 col) */}
              <div className="space-y-6">
                <div className="rounded-3xl bg-card border border-border/80 shadow-xl p-6">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3 text-muted-foreground">
                    <MapPin className="size-4 text-primary" />
                    <span>{lang === 'ar' ? 'عنوان التسليم والعميل' : 'Delivery Details'}</span>
                  </h3>
                  <div className="text-sm space-y-1 text-foreground">
                    <div className="font-semibold">{matchedOrder.customerName}</div>
                    <div className="text-muted-foreground text-xs">{matchedOrder.customerPhone}</div>
                    <div className="text-muted-foreground text-xs">
                      {typeof matchedOrder.shippingAddress === 'string'
                        ? matchedOrder.shippingAddress
                        : `${matchedOrder.shippingAddress?.street || ''}, ${matchedOrder.shippingAddress?.city || ''} ${matchedOrder.shippingAddress?.country || ''}`}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-card to-primary/5 border border-primary/20 shadow-xl p-6">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                    <MessageCircle className="size-4 text-primary" />
                    <span>{lang === 'ar' ? 'تحتاج مساعدة بشأن الطلب؟' : 'Need Help with Order?'}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {lang === 'ar'
                      ? 'فريق الدعم الفني جاهز لخدمتك والرد على كافة استفسارات الشحن والجمارك على مدار الساعة.'
                      : 'Our support team is ready to answer any questions about your shipment.'}
                  </p>

                  <div className="space-y-2">
                    <a
                      href={`https://wa.me/972501234567?text=${encodeURIComponent(
                        `مرحباً علي فليت، استفسار بخصوص طلبي رقم #${matchedOrder.id || (matchedOrder as any).orderNumber}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md transition-colors"
                    >
                      <MessageCircle className="size-4" />
                      <span>{lang === 'ar' ? 'محادثة واتساب مباشرة' : 'WhatsApp Support'}</span>
                    </a>
                    <a
                      href="tel:+972501234567"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-medium text-xs transition-colors"
                    >
                      <Phone className="size-4" />
                      <span>{lang === 'ar' ? 'اتصال بالدعم' : 'Call Support'}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Not Found State */
          <div className="rounded-3xl bg-card border border-border/80 shadow-xl p-12 text-center max-w-xl mx-auto">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-4">
              <Package className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {lang === 'ar' ? 'لم يتم العثور على طلب بهذا الرقم' : 'No Order Found'}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              {lang === 'ar'
                ? 'تأكد من كتابة رقم الطلب بالشكل الصحيح مثل ORD-7821 أو رقم الهاتف المسجل به الطلب.'
                : 'Please make sure you entered the correct order ID (e.g. ORD-7821) or phone number.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setSearchQuery('ORD-7821')}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                {lang === 'ar' ? 'عرض طلب تجريبي #ORD-7821' : 'View Sample #ORD-7821'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
