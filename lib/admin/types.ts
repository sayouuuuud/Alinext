export type MultiLangString = {
  ar: string
  en: string
  he: string
}

export type HeroContent = {
  line1: MultiLangString
  line2: MultiLangString
  line3: MultiLangString
  line4: MultiLangString
  subtitle: MultiLangString
  ctaSale: MultiLangString
  ctaImport: MultiLangString
  ctaShowroom: MultiLangString
  badge: MultiLangString
  slideFlagship: MultiLangString
  slideCustom: MultiLangString
  slideArmored: MultiLangString
  heroImage?: string
  slideImages?: string[]
  slideLabels?: MultiLangString[]
  avatarImage?: string
}

export type FleetItem = {
  id: string
  title: MultiLangString
  tag: MultiLangString
  description: MultiLangString
  image: string
}

export type FleetSectionContent = {
  eyebrow?: MultiLangString
  titleStart?: MultiLangString
  titleEm?: MultiLangString
  titleEnd?: MultiLangString
  lead?: MultiLangString
  vehicles: FleetItem[]
}

export type PageHeaderContent = {
  eyebrow?: MultiLangString
  title?: MultiLangString
  titleEm?: MultiLangString
  lead?: MultiLangString
  bannerImage?: string
}

export type StatItem = {
  id: string
  value: string
  label: MultiLangString
  suffix?: string
}

export type ServiceItem = {
  id: string
  title: MultiLangString
  subtitle: MultiLangString
  description: MultiLangString
  features: MultiLangString[]
  icon: string
  image?: string
  video?: string
  mediaAlt?: MultiLangString
}

export type GlobalReachContent = {
  title: MultiLangString
  subtitle: MultiLangString
  description: MultiLangString
  countriesCount: string
  vehiclesDelivered: string
  vipSatisfaction: string
}

export type CtaContent = {
  eyebrow?: MultiLangString
  title: MultiLangString
  description: MultiLangString
  buttonText: MultiLangString
  buttonLink: string
  secondaryText: MultiLangString
  secondaryLink: string
  backgroundImage?: string
  backgroundVideo?: string
}

export type CarItem = {
  id: string
  type: 'sale' | 'import'
  title: MultiLangString
  make: string
  model: string
  year: number
  price: number
  currency: string
  mileage: string
  fuel: string
  transmission: string
  image: string
  images?: string[]
  status: 'available' | 'reserved' | 'sold' | 'incoming'
  featured: boolean
  origin?: 'germany' | 'uae' | 'usa' | 'japan' | 'korea' | 'belgium'
  condition?: 'new' | 'used' | 'demo'
  stage?: 1 | 2 | 3 | 4
  previousOwners?: number
  eta?: MultiLangString
  availability?: MultiLangString
  highlights?: MultiLangString[]
  specs: {
    engine?: string
    horsepower?: string
    acceleration?: string
    topSpeed?: string
    bodyType?: string
    color?: string
    drivetrain?: string
    seats?: number
  }
  description: MultiLangString
}

export type ProductItem = {
  id: string
  name: MultiLangString
  sku: string
  category: string
  brand?: string
  price: number
  inStock: boolean
  featured?: boolean
  compatibility: string
  image: string
  images?: string[]
  specs?: { label: MultiLangString; value: MultiLangString }[]
  description: MultiLangString
}

export type BlogPostItem = {
  id: string
  slug: string
  title: MultiLangString
  excerpt: MultiLangString
  content?: MultiLangString
  author: string
  authorAvatar?: string
  date: string
  readTime: string
  coverImage?: string
  tags?: string[]
  category?: string
  image?: string
  published?: boolean
  featured?: boolean
}

export type ContactSettings = {
  companyName: string
  phone: string
  whatsapp: string
  email: string
  address: MultiLangString
  hours: MultiLangString
  googleMapsUrl: string
}

export type SocialLinks = {
  instagram: string
  facebook: string
  linkedin: string
  tiktok: string
  youtube: string
}

export type NavigationContent = {
  home: MultiLangString
  products: MultiLangString
  cars: MultiLangString
  trackOrder: MultiLangString
  blog: MultiLangString
  contact: MultiLangString
  cart: MultiLangString
}

export type FooterContent = {
  tagline?: MultiLangString
  rights?: MultiLangString
  slogan?: MultiLangString
}

export type SectionHeaderContent = {
  eyebrow?: MultiLangString
  title?: MultiLangString
  titleEm?: MultiLangString
  lead?: MultiLangString
}

export type CarsPageContent = PageHeaderContent & {
  saleHeader?: SectionHeaderContent
  importHeader?: SectionHeaderContent
}

export type PolicyItem = {
  id: 'privacy' | 'terms' | 'refund'
  title: MultiLangString
  lastUpdated: string
  content: MultiLangString
}

export type InquiryItem = {
  id: string
  name: string
  email: string
  phone: string
  service: string
  message: string
  date: string
  status: 'new' | 'contacted' | 'resolved'
}

export type OrderItem = {
  id: string
  title: string
  quantity: number
  price: number
  image?: string
  sku?: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'completed'

export type OrderRecord = {
  id: string // e.g. "ORD-7821"
  customerId?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  date: string
  status: OrderStatus
  total: number
  currency: string
  items: OrderItem[]
  shippingAddress: {
    street: string
    city: string
    country: string
    postalCode?: string
  }
  paymentMethod: 'cod' | 'card' | 'bank_transfer'
  paymentStatus: 'paid' | 'unpaid' | 'refunded'
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
  notes?: string
}

export type CustomerOrder = {
  id: string
  orderNumber: string
  date: string
  total: number
  status: OrderStatus
  items: { name: string; quantity: number; price: number }[]
}

export type CustomerItem = {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  tier: 'VIP' | 'Platinum' | 'Gold' | 'Regular'
  status: 'active' | 'suspended' | 'pending'
  joinedDate: string
  billingAddress: {
    street: string
    city: string
    country: string
    postalCode?: string
  }
  shippingAddress: {
    street: string
    city: string
    country: string
  }
  totalSpent: number
  ordersCount: number
  interestedIn?: string
  notes?: string
  orders: CustomerOrder[]
}

export type AdminSecuritySettings = {
  username: string
  email: string
  passwordHash?: string
  twoFactorEnabled: boolean
  sessionTimeoutMinutes: number
  lastPasswordChange?: string
  notifyOnNewLogin?: boolean
}

export type CommerceSettings = {
  currency?: string
  currencySymbol?: string
  currencyPosition?: 'before' | 'after' | 'left' | 'right'
  taxRatePercent?: number
  vatPercentage?: number
  freeShippingThreshold?: number
  freeDeliveryThreshold?: number
  enableCardPayment?: boolean
  enableCardPayments?: boolean
  enablePaypal?: boolean
  enableBankWire?: boolean
  enableBankTransfer?: boolean
  enableCashOnDelivery?: boolean
  enableCod?: boolean
  enableWhatsappOrder?: boolean
}

export type BrandingSettings = {
  logoLightUrl: string
  logoDarkUrl: string
  faviconUrl: string
  tagline: MultiLangString
  accentColor?: string
  primaryAccentColor?: string
}

export type NotificationSettings = {
  adminAlertEmail?: string
  whatsappAlertNumber?: string
  alertWhatsapp?: string
  soundAlerts?: boolean
  soundAlertEnabled?: boolean
  autoReplyEmail?: boolean
  autoReplyCustomer?: boolean
  alertEmail?: string
}

export type SeoSettings = {
  googleAnalyticsId?: string
  metaPixelId?: string
  searchConsoleTag?: string
  googleSearchConsoleTag?: string
  defaultMetaTitle: MultiLangString
  defaultMetaDescription: MultiLangString
  gaMeasurementId?: string
}

export type MaintenanceSettings = {
  enabled: boolean
  message: MultiLangString
  allowedIps?: string
  notice?: MultiLangString
}

export type SiteFullContent = {
  version: number
  lastSaved: string
  security: AdminSecuritySettings
  commerce: CommerceSettings
  branding: BrandingSettings
  notifications: NotificationSettings
  seo: SeoSettings
  maintenance: MaintenanceSettings
  general: {
    contact: ContactSettings
    social: SocialLinks
    currency: string
    navigation?: NavigationContent
    footer?: FooterContent
  }
  pages: {
    home: {
      hero: HeroContent
      fleet?: FleetSectionContent
      stats: StatItem[]
      marquee: MultiLangString[]
      globalReach: GlobalReachContent
      services: ServiceItem[]
      cta: CtaContent
    }
    cars?: CarsPageContent
    products?: PageHeaderContent
    blog?: PageHeaderContent
    contact?: PageHeaderContent
    trackOrder?: PageHeaderContent
    cart?: PageHeaderContent
    policies: PolicyItem[]
  }
  cars: CarItem[]
  products: ProductItem[]
  blog: BlogPostItem[]
  orders: OrderRecord[]
  inquiries?: InquiryItem[]
  customers: CustomerItem[]
}

