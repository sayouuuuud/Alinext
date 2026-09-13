export type OrderMailLocale = 'ar' | 'en' | 'he'

export type OrderMailEvent =
  | 'order_received'
  | 'order_confirmed'
  | 'order_processing'
  | 'order_shipping'
  | 'order_delivered'
  | 'order_completed'
  | 'order_cancelled'

export type OrderMailInput = {
  eventType: OrderMailEvent
  locale: OrderMailLocale
  orderNumber: string
  status: string
  carrier?: string | null
  trackingNumber?: string | null
  estimatedDelivery?: string | null
  note?: string | null
  orderHref: string
  invoiceHref: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type Copy = { subject: string; title: string; body: string }

const COPY: Record<OrderMailEvent, Record<OrderMailLocale, Copy>> = {
  order_received: {
    ar: { subject: 'استلمنا طلبك', title: 'تم استلام الطلب', body: 'طلبك قيد المراجعة وسنعلمك عند اعتماده.' },
    en: { subject: 'We received your order', title: 'Order received', body: 'Your order is under review. We will notify you once it is confirmed.' },
    he: { subject: 'קיבלנו את ההזמנה', title: 'ההזמנה התקבלה', body: 'ההזמנה בבדיקה ונודיע לך כשתאושר.' },
  },
  order_confirmed: {
    ar: { subject: 'تم اعتماد طلبك', title: 'اعتمدنا طلبك', body: 'وافق فريقنا على الطلب وبدأنا التنفيذ.' },
    en: { subject: 'Your order is confirmed', title: 'Order confirmed', body: 'Our team approved your order and started fulfillment.' },
    he: { subject: 'ההזמנה אושרה', title: 'אישרנו את ההזמנה', body: 'הצוות אישר את ההזמנה והתחיל בטיפול.' },
  },
  order_processing: {
    ar: { subject: 'طلبك قيد التجهيز', title: 'نجهز طلبك الآن', body: 'نفحص العناصر ونجهزها قبل الشحن.' },
    en: { subject: 'Your order is being prepared', title: 'Order in preparation', body: 'We are checking and packing your items before shipping.' },
    he: { subject: 'ההזמנה בהכנה', title: 'מכינים את ההזמנה', body: 'בודקים ואורזים את הפריטים לפני המשלוח.' },
  },
  order_shipping: {
    ar: { subject: 'طلبك في الشحن', title: 'الطلب في الطريق إليك', body: 'تم شحن طلبك. تابع رقم التتبع أدناه.' },
    en: { subject: 'Your order is on its way', title: 'Order shipped', body: 'Your order has shipped. Track it with the number below.' },
    he: { subject: 'ההזמנה במשלוח', title: 'ההזמנה בדרך אליך', body: 'ההזמנה נשלחה. עקוב עם מספר המעקב למטה.' },
  },
  order_delivered: {
    ar: { subject: 'وصل طلبك — أكد الاستلام', title: 'الطلب وصل', body: 'وصل طلبك. من فضلك أكد الاستلام من صفحة الطلب.' },
    en: { subject: 'Your order arrived — please confirm', title: 'Order delivered', body: 'Your order arrived. Please confirm receipt from the order page.' },
    he: { subject: 'ההזמנה הגיעה — אשר קבלה', title: 'ההזמנה נמסרה', body: 'ההזמנה הגיעה. אשר את הקבלה מעמוד ההזמנה.' },
  },
  order_completed: {
    ar: { subject: 'اكتمل طلبك', title: 'رحلة طلبك اكتملت', body: 'شكرًا لك. يمكنك عرض الفاتورة من الرابط أدناه.' },
    en: { subject: 'Your order is complete', title: 'Order complete', body: 'Thank you. You can view the invoice from the link below.' },
    he: { subject: 'ההזמנה הושלמה', title: 'ההזמנה הושלמה בהצלחה', body: 'תודה. ניתן לצפות בחשבונית מהקישור למטה.' },
  },
  order_cancelled: {
    ar: { subject: 'تم إلغاء الطلب', title: 'ألغينا الطلب', body: 'تم إلغاء الطلب. تواصل معنا إذا كان لديك أي استفسار.' },
    en: { subject: 'Order cancelled', title: 'Order cancelled', body: 'The order was cancelled. Contact us if you have any questions.' },
    he: { subject: 'ההזמנה בוטלה', title: 'ההזמנה בוטלה', body: 'ההזמנה בוטלה. צור קשר אם יש שאלות.' },
  },
}

export function normalizeLocale(value: string | null | undefined): OrderMailLocale {
  if (value === 'en' || value === 'he') return value
  return 'ar'
}

export function normalizeEvent(value: string): OrderMailEvent | null {
  if ((Object.keys(COPY) as string[]).includes(value)) return value as OrderMailEvent
  return null
}

export function buildOrderStatusEmail(input: OrderMailInput): { subject: string; html: string; text: string } {
  const copy = COPY[input.eventType][input.locale]
  const subject = `${copy.subject} #${input.orderNumber} — ALI FLEET`
  const dir = input.locale === 'en' ? 'ltr' : 'rtl'
  const rows: Array<[string, string]> = []
  const label = (ar: string, en: string, he: string) => (input.locale === 'en' ? en : input.locale === 'he' ? he : ar)
  rows.push([label('رقم الطلب', 'Order', 'מספר הזמנה'), input.orderNumber])
  rows.push([label('الحالة', 'Status', 'סטטוס'), input.status])
  if (input.carrier) rows.push([label('شركة الشحن', 'Carrier', 'חברת משלוח'), input.carrier])
  if (input.trackingNumber) rows.push([label('رقم التتبع', 'Tracking', 'מעקב'), input.trackingNumber])
  if (input.estimatedDelivery) rows.push([label('الوصول المتوقع', 'Estimated delivery', 'הגעה משוערת'), input.estimatedDelivery])
  if (input.note) rows.push([label('ملاحظة', 'Note', 'הערה'), input.note])

  const rowHtml = rows
    .map(([k, v]) => `<tr><td style="padding:8px 12px;color:#666">${escapeHtml(k)}</td><td style="padding:8px 12px;font-weight:600">${escapeHtml(v)}</td></tr>`)
    .join('')
  const rowText = rows.map(([k, v]) => `${k}: ${v}`).join('\n')

  const orderLabel = label('عرض الطلب', 'View order', 'צפה בהזמנה')
  const invoiceLabel = label('عرض الفاتورة', 'View invoice', 'צפה בחשבונית')
  const html = `<div dir="${dir}" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
<h1 style="font-size:22px;margin:0 0 8px">ALI FLEET — ${escapeHtml(copy.title)}</h1>
<p style="color:#444">${escapeHtml(copy.body)}</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #eee">${rowHtml}</table>
<p><a href="${escapeHtml(input.orderHref)}">${escapeHtml(orderLabel)}</a> · <a href="${escapeHtml(input.invoiceHref)}">${escapeHtml(invoiceLabel)}</a></p>
</div>`
  const text = `ALI FLEET — ${copy.title}\n${copy.body}\n\n${rowText}\n\n${orderLabel}: ${input.orderHref}\n${invoiceLabel}: ${input.invoiceHref}`
  return { subject, html, text }
}

export function publicOrderLinks(orderId: string): { orderHref: string; invoiceHref: string } {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  if (!base) return { orderHref: `/account/orders/${orderId}`, invoiceHref: `/account/orders/${orderId}/invoice` }
  return { orderHref: `${base}/account/orders/${orderId}`, invoiceHref: `${base}/account/orders/${orderId}/invoice` }
}
