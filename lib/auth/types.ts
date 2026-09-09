export type AuthErrorCode =
  | 'not_configured'
  | 'network'
  | 'missing_fields'
  | 'invalid_credentials'
  | 'invalid_email'
  | 'email_exists'
  | 'username_exists'
  | 'weak_password'
  | 'password_mismatch'
  | 'registration_disabled'
  | 'session_expired'
  | 'not_logged_in'
  | 'backend_missing'
  | 'reset_unavailable'
  | 'unknown'

export type Viewer = {
  databaseId: number
  username: string
  email: string
  firstName: string
  lastName: string
  name: string
  registeredDate: string | null
}

export type CustomerAddress = {
  firstName: string
  lastName: string
  company: string
  address1: string
  address2: string
  city: string
  state: string
  postcode: string
  country: string
  phone: string
  email?: string
}

export type OrderLine = {
  name: string
  slug: string | null
  quantity: number
  total: string
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'onhold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'checkoutdraft'

export type CustomerOrder = {
  databaseId: number
  orderNumber: string
  date: string | null
  status: OrderStatus
  total: string
  subtotal: string
  totalTax: string
  shippingTotal: string
  paymentMethodTitle: string
  lines: OrderLine[]
}

export type Customer = {
  databaseId: number
  email: string
  firstName: string
  lastName: string
  displayName: string
  date: string | null
  billing: CustomerAddress
  shipping: CustomerAddress
  orders: CustomerOrder[]
}

export type AccountData =
  | { state: 'ready'; customer: Customer; viewer: Viewer }
  | { state: 'error'; code: AuthErrorCode }

export type AuthActionState = {
  status: 'idle' | 'success' | 'error'
  code?: AuthErrorCode
  fieldErrors?: Partial<Record<string, AuthErrorCode>>
}

export const idleActionState: AuthActionState = { status: 'idle' }

const EMPTY_ADDRESS: CustomerAddress = {
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postcode: '',
  country: '',
  phone: '',
}

export function emptyAddress(): CustomerAddress {
  return { ...EMPTY_ADDRESS }
}
