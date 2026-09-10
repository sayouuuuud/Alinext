import type { Database } from '@/lib/supabase/database.types'

export type CartLine = {
  slug: string
  quantity: number
}

export type CheckoutDefaults = {
  fullName: string
  phone: string
  street: string
  city: string
  country: string
  postalCode: string
}

export type CheckoutErrorCode =
  | 'not_logged_in'
  | 'invalid_fields'
  | 'email_unconfirmed'
  | 'product_unavailable'
  | 'order_failed'

export type CheckoutActionState =
  | { status: 'idle' }
  | { status: 'error'; code: CheckoutErrorCode }
  | { status: 'success'; orderNumber: string }

export const idleCheckoutState: CheckoutActionState = { status: 'idle' }

export type InquiryErrorCode = 'invalid_fields' | 'rate_limited' | 'submit_failed'

export type InquiryActionState =
  | { status: 'idle' }
  | { status: 'error'; code: InquiryErrorCode }
  | { status: 'success' }

export const idleInquiryState: InquiryActionState = { status: 'idle' }

export type TrackingOrderStatus = Database['public']['Enums']['order_status']

export type TrackingOrder = {
  id: string
  orderNumber: string
  createdAt: string
  status: TrackingOrderStatus
  totalMinor: number
  currency: string
  paymentMethod: string
  paymentStatus: Database['public']['Enums']['payment_status']
  trackingNumber: string | null
  carrier: string | null
  estimatedDelivery: string | null
  customerName: string
  customerPhone: string
  shippingAddress: {
    fullName: string
    phone: string
    street: string
    city: string
    country: string
    postalCode: string
  }
  items: Array<{
    id: string
    productId: string | null
    name: { ar: string; en: string; he: string }
    sku: string
    image: string | null
    unitPriceMinor: number
    quantity: number
    lineTotalMinor: number
  }>
  history: Array<{
    id: string
    fromStatus: TrackingOrderStatus | null
    toStatus: TrackingOrderStatus
    note: string | null
    createdAt: string
  }>
}

export type TrackingOrdersResult =
  | { state: 'signed_out'; orders: [] }
  | { state: 'ready'; orders: TrackingOrder[] }
  | { state: 'error'; orders: [] }
