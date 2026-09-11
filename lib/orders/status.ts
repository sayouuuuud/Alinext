import type { Database } from '@/lib/supabase/database.types'

export type OrderStatus = Database['public']['Enums']['order_status']

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
  'completed',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, { ar: string; en: string; he: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending review', he: 'ממתין לבדיקה' },
  confirmed: { ar: 'تم الاعتماد', en: 'Confirmed', he: 'אושר' },
  processing: { ar: 'قيد التجهيز', en: 'Processing', he: 'בהכנה' },
  shipping: { ar: 'في الشحن', en: 'Shipping', he: 'במשלוח' },
  delivered: { ar: 'تم التسليم', en: 'Delivered', he: 'נמסר' },
  completed: { ar: 'مكتمل', en: 'Completed', he: 'הושלם' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', he: 'בוטל' },
}

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, { ar: string; en: string; he: string }> = {
  pending: { ar: 'استلمنا طلبك وهو الآن بانتظار المراجعة.', en: 'We received your order and it is awaiting review.', he: 'קיבלנו את ההזמנה והיא ממתינה לבדיקה.' },
  confirmed: { ar: 'اعتمد فريقنا الطلب وبدأت رحلة التنفيذ.', en: 'Our team confirmed the order.', he: 'הצוות שלנו אישר את ההזמנה.' },
  processing: { ar: 'يجري تجهيز العناصر وفحصها قبل الشحن.', en: 'Items are being prepared for shipping.', he: 'הפריטים מוכנים למשלוח.' },
  shipping: { ar: 'الطلب في الطريق إليك.', en: 'Your order is on its way.', he: 'ההזמנה בדרך אליך.' },
  delivered: { ar: 'وصل الطلب وينتظر تأكيد استلامك.', en: 'The order arrived and awaits your confirmation.', he: 'ההזמנה הגיעה וממתינה לאישור.' },
  completed: { ar: 'اكتملت رحلة الطلب بنجاح.', en: 'The order journey is complete.', he: 'ההזמנה הושלמה בהצלחה.' },
  cancelled: { ar: 'تم إلغاء الطلب.', en: 'The order was cancelled.', he: 'ההזמנה בוטלה.' },
}

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
}

export function orderStatusLabel(status: OrderStatus, locale = 'ar') {
  const normalized = locale === 'en' || locale === 'he' ? locale : 'ar'
  return ORDER_STATUS_LABELS[status][normalized]
}

export function orderStatusDescription(status: OrderStatus, locale = 'ar') {
  const normalized = locale === 'en' || locale === 'he' ? locale : 'ar'
  return ORDER_STATUS_DESCRIPTIONS[status][normalized]
}

export function nextOrderStatus(status: OrderStatus) {
  return ALLOWED_ORDER_TRANSITIONS[status].find((value) => value !== 'cancelled') ?? null
}

export function isActiveOrder(status: OrderStatus) {
  return !['completed', 'cancelled'].includes(status)
}
