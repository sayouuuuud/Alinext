import 'server-only'

import { absoluteUrl } from '@/lib/seo'
import type { Json } from '@/lib/supabase/database.types'

type Locale = 'ar' | 'en' | 'he'
type TemplateInput = {
  eventType: string
  payload: Json
  locale: string
  orderId: string
  orderNumber: string
}

type Translation = {
  subject: string
  heading: string
  body: string
}

const COPY: Record<Locale, Record<string, Translation>> = {
  ar: {
    order_received: { subject: 'تم استلام طلبك', heading: 'استلمنا طلبك', body: 'طلبك الآن قيد المراجعة، وسنوافيك بأي تحديث.' },
    order_confirmed: { subject: 'تم تأكيد طلبك', heading: 'تم اعتماد الطلب', body: 'أكد فريقنا طلبك وبدأت رحلة التنفيذ.' },
    order_processing: { subject: 'طلبك قيد التجهيز', heading: 'نجّهز طلبك الآن', body: 'يجري تجهيز العناصر وفحصها قبل الشحن.' },
    order_shipping: { subject: 'طلبك في الطريق', heading: 'تم شحن طلبك', body: 'طلبك في الطريق إليك. ستجد بيانات التتبع أدناه.' },
    order_delivered: { subject: 'تم تسليم طلبك', heading: 'وصل طلبك', body: 'تم تسجيل الطلب كمُسلّم. يمكنك تأكيد الاستلام من حسابك.' },
    order_completed: { subject: 'اكتمل طلبك', heading: 'شكرًا لاختيار ALI FLEET', body: 'اكتملت رحلة طلبك بنجاح.' },
    order_cancelled: { subject: 'تم إلغاء طلبك', heading: 'تم إلغاء الطلب', body: 'تم إلغاء طلبك وإرجاع المخزون المحجوز.' },
  },
  en: {
    order_received: { subject: 'We received your order', heading: 'Order received', body: 'Your order is awaiting review. We will keep you updated.' },
    order_confirmed: { subject: 'Your order is confirmed', heading: 'Order confirmed', body: 'Our team confirmed your order and fulfillment has started.' },
    order_processing: { subject: 'Your order is being prepared', heading: 'Preparing your order', body: 'Your items are being prepared and checked before shipping.' },
    order_shipping: { subject: 'Your order is on the way', heading: 'Order shipped', body: 'Your order is on the way. Tracking details are below.' },
    order_delivered: { subject: 'Your order was delivered', heading: 'Order delivered', body: 'Your order was marked as delivered. You can confirm receipt in your account.' },
    order_completed: { subject: 'Your order is complete', heading: 'Thank you for choosing ALI FLEET', body: 'Your order journey is now complete.' },
    order_cancelled: { subject: 'Your order was cancelled', heading: 'Order cancelled', body: 'Your order was cancelled and its reserved inventory was restored.' },
  },
  he: {
    order_received: { subject: 'ההזמנה שלך התקבלה', heading: 'ההזמנה התקבלה', body: 'ההזמנה ממתינה לבדיקה. נעדכן אותך בכל שינוי.' },
    order_confirmed: { subject: 'ההזמנה שלך אושרה', heading: 'ההזמנה אושרה', body: 'הצוות שלנו אישר את ההזמנה והטיפול בה החל.' },
    order_processing: { subject: 'ההזמנה שלך בהכנה', heading: 'מכינים את ההזמנה', body: 'הפריטים מוכנים ונבדקים לפני המשלוח.' },
    order_shipping: { subject: 'ההזמנה שלך בדרך', heading: 'ההזמנה נשלחה', body: 'ההזמנה בדרך אליך. פרטי המעקב מופיעים למטה.' },
    order_delivered: { subject: 'ההזמנה שלך נמסרה', heading: 'ההזמנה נמסרה', body: 'ההזמנה סומנה כנמסרה. ניתן לאשר קבלה בחשבון.' },
    order_completed: { subject: 'ההזמנה הושלמה', heading: 'תודה שבחרת ב-ALI FLEET', body: 'תהליך ההזמנה הושלם בהצלחה.' },
    order_cancelled: { subject: 'ההזמנה שלך בוטלה', heading: 'ההזמנה בוטלה', body: 'ההזמנה בוטלה והמלאי ששוריין הוחזר.' },
  },
}

function localeOf(value: string): Locale {
  return value === 'en' || value === 'he' ? value : 'ar'
}

function objectOf(value: Json): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function text(value: Json | undefined) {
  return typeof value === 'string' ? value : ''
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}

export function renderOrderEmail(input: TemplateInput) {
  const locale = localeOf(input.locale)
  const copy = COPY[locale][input.eventType] || COPY[locale].order_received
  const payload = objectOf(input.payload)
  const trackingNumber = text(payload.trackingNumber)
  const carrier = text(payload.carrier)
  const estimatedDelivery = text(payload.estimatedDelivery)
  const direction = locale === 'en' ? 'ltr' : 'rtl'
  const labels = locale === 'ar'
    ? { order: 'رقم الطلب', tracking: 'رقم التتبع', carrier: 'شركة الشحن', delivery: 'التسليم المتوقع', details: 'عرض تفاصيل الطلب', invoice: 'عرض الفاتورة' }
    : locale === 'he'
      ? { order: 'מספר הזמנה', tracking: 'מספר מעקב', carrier: 'חברת משלוחים', delivery: 'מסירה משוערת', details: 'צפייה בפרטי ההזמנה', invoice: 'צפייה בחשבונית' }
      : { order: 'Order number', tracking: 'Tracking number', carrier: 'Carrier', delivery: 'Estimated delivery', details: 'View order details', invoice: 'View invoice' }
  const detailsUrl = absoluteUrl(`/account/orders/${input.orderId}`)
  const invoiceUrl = absoluteUrl(`/account/orders/${input.orderId}/invoice`)
  const facts = [
    `${labels.order}: ${input.orderNumber}`,
    trackingNumber ? `${labels.tracking}: ${trackingNumber}` : '',
    carrier ? `${labels.carrier}: ${carrier}` : '',
    estimatedDelivery ? `${labels.delivery}: ${estimatedDelivery}` : '',
  ].filter(Boolean)

  const htmlFacts = facts.map((fact) => `<li style="margin:0 0 8px">${escapeHtml(fact)}</li>`).join('')
  const html = `<!doctype html><html lang="${locale}" dir="${direction}"><body style="margin:0;background:#f4f5f7;color:#172033;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe3e8;border-radius:16px"><tr><td style="padding:32px"><p style="margin:0 0 24px;color:#155eef;font-weight:700;letter-spacing:.08em">ALI FLEET</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.3">${escapeHtml(copy.heading)}</h1><p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#4b5565">${escapeHtml(copy.body)}</p><ul style="margin:0 0 28px;padding-${direction === 'rtl' ? 'right' : 'left'}:20px;line-height:1.6">${htmlFacts}</ul><p style="margin:0;display:flex;gap:12px;flex-wrap:wrap"><a href="${detailsUrl}" style="display:inline-block;padding:12px 18px;background:#155eef;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700">${escapeHtml(labels.details)}</a><a href="${invoiceUrl}" style="display:inline-block;padding:12px 18px;color:#155eef;text-decoration:none;font-weight:700">${escapeHtml(labels.invoice)}</a></p></td></tr></table></td></tr></table></body></html>`
  const plainText = `${copy.heading}\n\n${copy.body}\n\n${facts.join('\n')}\n\n${labels.details}: ${detailsUrl}\n${labels.invoice}: ${invoiceUrl}`

  return { subject: `${copy.subject} · ${input.orderNumber}`, html, text: plainText }
}
