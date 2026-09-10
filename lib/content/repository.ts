import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { getPublicSiteContent, PUBLIC_CONTENT_TAG } from './public-database'
import type { Json } from '@/lib/supabase/database.types'
import type {
  BlogPostItem,
  CarItem,
  CustomerItem,
  InquiryItem,
  MultiLangString,
  OrderRecord,
  ProductItem,
  SiteFullContent,
} from '@/lib/admin/types'

export const SITE_CONTENT_TAG = PUBLIC_CONTENT_TAG

function record(value: Json | undefined | null): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {}
}

function i18n(value: Json | undefined | null, fallback = ''): MultiLangString {
  const item = record(value)
  return {
    ar: typeof item.ar === 'string' ? item.ar : fallback,
    en: typeof item.en === 'string' ? item.en : fallback,
    he: typeof item.he === 'string' ? item.he : fallback,
  }
}

type MediaRow = { car_id?: string; product_id?: string; url: string; sort_order: number }
type HighlightRow = { car_id: string; content: Json; sort_order: number }
type SpecRow = { product_id: string; label: Json; value: Json; sort_order: number }
type CompatibilityRow = { product_id: string; notes: string | null; make: string | null; model: string | null }

async function loadBaseAndCatalog(includeUnpublished: boolean): Promise<SiteFullContent> {
  const admin = createAdminClient()
  const [baseContent, privateSettingsResult, carsResult, carMediaResult, highlightsResult, productsResult, productMediaResult, specsResult, compatibilityResult, postsResult] = await Promise.all([
    getPublicSiteContent(),
    admin.from('site_settings_private').select('key,value,updated_at'),
    admin.from('cars').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false }),
    admin.from('car_media').select('car_id,url,sort_order').order('sort_order'),
    admin.from('car_highlights').select('car_id,content,sort_order').order('sort_order'),
    admin.from('products').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false }),
    admin.from('product_media').select('product_id,url,sort_order').order('sort_order'),
    admin.from('product_specs').select('product_id,label,value,sort_order').order('sort_order'),
    admin.from('product_compatibility').select('product_id,make,model,notes'),
    admin.from('blog_posts').select('*').order('published_at', { ascending: false }),
  ])

  const firstError = [privateSettingsResult, carsResult, carMediaResult, highlightsResult, productsResult, productMediaResult, specsResult, compatibilityResult, postsResult].find((result) => result.error)?.error
  if (firstError) throw new Error(`Supabase content query failed: ${firstError.message}`)

  const carMedia = (carMediaResult.data || []) as unknown as MediaRow[]
  const highlights = (highlightsResult.data || []) as unknown as HighlightRow[]
  const productMedia = (productMediaResult.data || []) as unknown as MediaRow[]
  const specs = (specsResult.data || []) as unknown as SpecRow[]
  const compatibility = (compatibilityResult.data || []) as unknown as CompatibilityRow[]

  const cars: CarItem[] = (carsResult.data || [])
    .filter((car) => includeUnpublished || (car.published && !car.archived_at))
    .map((car) => {
      const images = carMedia.filter((media) => media.car_id === car.id).map((media) => media.url)
      return {
        id: car.slug || car.id,
        type: car.type === 'import' ? 'import' : 'sale',
        title: i18n(car.title, `${car.make} ${car.model}`),
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price_minor == null ? 0 : car.price_minor / 100,
        currency: car.currency === 'ILS' ? '₪' : car.currency,
        mileage: car.mileage || '',
        fuel: car.fuel || '',
        transmission: car.transmission || '',
        image: car.primary_image || images[0] || '/images/fleet-truck.png',
        images,
        status: ['available', 'reserved', 'sold', 'incoming'].includes(car.status) ? car.status as CarItem['status'] : 'available',
        featured: car.featured,
        origin: car.origin as CarItem['origin'],
        condition: car.condition as CarItem['condition'],
        stage: car.import_stage as CarItem['stage'],
        previousOwners: car.previous_owners ?? undefined,
        eta: car.eta ? i18n(car.eta) : undefined,
        availability: car.availability ? i18n(car.availability) : undefined,
        highlights: highlights.filter((item) => item.car_id === car.id).map((item) => i18n(item.content)),
        specs: record(car.specs) as CarItem['specs'],
        description: i18n(car.description),
      }
    })

  const products: ProductItem[] = (productsResult.data || [])
    .filter((product) => includeUnpublished || (product.published && !product.archived_at))
    .map((product) => {
      const images = productMedia.filter((media) => media.product_id === product.id).map((media) => media.url)
      const compatibilityItems = compatibility.filter((item) => item.product_id === product.id).map((item) => item.notes || [item.make, item.model].filter(Boolean).join(' ')).filter(Boolean)
      return {
        id: product.slug || product.id,
        name: i18n(product.name, product.sku),
        sku: product.sku,
        category: product.category,
        brand: product.brand || undefined,
        price: product.price_minor / 100,
        inStock: product.stock_quantity > 0,
        featured: product.featured,
        compatibility: compatibilityItems.join(', ') || product.compatibility_summary || '',
        image: product.primary_image || images[0] || '/images/part-brake-pads.png',
        images,
        specs: specs.filter((item) => item.product_id === product.id).map((item) => ({ label: i18n(item.label), value: i18n(item.value) })),
        description: i18n(product.description),
      }
    })

  const blog: BlogPostItem[] = (postsResult.data || [])
    .filter((post) => includeUnpublished || (post.published && (!post.published_at || new Date(post.published_at) <= new Date())))
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: i18n(post.title),
      excerpt: i18n(post.excerpt),
      content: post.content ? i18n(post.content) : undefined,
      author: post.author,
      authorAvatar: post.author_avatar || undefined,
      date: post.published_at || post.created_at,
      readTime: post.read_time || '5 min',
      coverImage: post.cover_image || undefined,
      image: post.cover_image || undefined,
      tags: post.tags,
      category: post.category || undefined,
      published: post.published,
      featured: post.featured,
    }))

  const privateRows = (privateSettingsResult.data || []) as unknown as Array<{ key: string; value: Json; updated_at: string }>
  const privateSettings = new Map(privateRows.map((row) => [row.key, row.value]))
  const security = record(privateSettings.get('admin_security'))
  const lastSaved = [baseContent.lastSaved, ...privateRows.map((row) => row.updated_at)].sort().at(-1) || baseContent.lastSaved

  return {
    ...baseContent,
    lastSaved,
    security: {
      ...baseContent.security,
      sessionTimeoutMinutes: typeof security.session_timeout_minutes === 'number' ? security.session_timeout_minutes : 60,
      notifyOnNewLogin: security.notify_on_new_login === true,
    },
    notifications: record(privateSettings.get('notifications')) as unknown as SiteFullContent['notifications'],
    cars,
    products,
    blog,
  }
}

export async function getSiteContent(): Promise<SiteFullContent> {
  return getPublicSiteContent()
}

function paymentMethod(value: string): OrderRecord['paymentMethod'] {
  return value === 'card' || value === 'bank_transfer' ? value : 'cod'
}

function addressSnapshot(value: Json) {
  const data = record(value)
  return {
    street: typeof data.street === 'string' ? data.street : '',
    city: typeof data.city === 'string' ? data.city : '',
    country: typeof data.country === 'string' ? data.country : '',
    postalCode: typeof data.postalCode === 'string' ? data.postalCode : undefined,
  }
}

export async function getAdminSiteContent(): Promise<SiteFullContent> {
  const content = await loadBaseAndCatalog(true)
  const admin = createAdminClient()
  const [ordersResult, orderItemsResult, profilesResult, addressesResult, inquiriesResult] = await Promise.all([
    admin.from('orders').select('*').order('created_at', { ascending: false }),
    admin.from('order_items').select('*'),
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.from('addresses').select('*').order('is_default', { ascending: false }),
    admin.from('inquiries').select('*').order('created_at', { ascending: false }),
  ])
  const firstError = [ordersResult, orderItemsResult, profilesResult, addressesResult, inquiriesResult].find((result) => result.error)?.error
  if (firstError) throw new Error(`Supabase admin query failed: ${firstError.message}`)

  const orderItems = orderItemsResult.data || []
  const orders: OrderRecord[] = (ordersResult.data || []).map((order) => ({
    id: order.order_number,
    customerId: order.user_id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    date: order.created_at,
    status: order.status,
    total: order.total_minor / 100,
    currency: order.currency === 'ILS' ? '₪' : order.currency,
    items: orderItems.filter((item) => item.order_id === order.id).map((item) => ({
      id: item.id,
      title: i18n(item.product_name, item.sku).en || item.sku,
      quantity: item.quantity,
      price: item.unit_price_minor / 100,
      image: item.image || undefined,
      sku: item.sku,
    })),
    shippingAddress: addressSnapshot(order.shipping_address),
    paymentMethod: paymentMethod(order.payment_method),
    paymentStatus: order.payment_status,
    trackingNumber: order.tracking_number || undefined,
    carrier: order.carrier || undefined,
    estimatedDelivery: order.estimated_delivery || undefined,
    notes: order.admin_notes || order.customer_notes || undefined,
  }))

  const addresses = addressesResult.data || []
  const customers: CustomerItem[] = (profilesResult.data || []).map((profile) => {
    const userOrders = orders.filter((order) => order.customerId === profile.id)
    const billing = addresses.find((address) => address.user_id === profile.id && address.kind === 'billing')
    const shipping = addresses.find((address) => address.user_id === profile.id && address.kind === 'shipping')
    return {
      id: profile.id,
      name: profile.display_name || profile.email.split('@')[0],
      email: profile.email,
      phone: profile.phone || '',
      avatar: profile.avatar_url || undefined,
      tier: ['VIP', 'Platinum', 'Gold', 'Regular'].includes(profile.tier) ? profile.tier as CustomerItem['tier'] : 'Regular',
      status: ['active', 'suspended', 'pending'].includes(profile.status) ? profile.status as CustomerItem['status'] : 'pending',
      joinedDate: profile.created_at,
      billingAddress: { street: billing?.street || '', city: billing?.city || '', country: billing?.country || '', postalCode: billing?.postal_code || undefined },
      shippingAddress: { street: shipping?.street || '', city: shipping?.city || '', country: shipping?.country || '' },
      totalSpent: userOrders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.total, 0),
      ordersCount: userOrders.length,
      interestedIn: profile.interested_in || undefined,
      notes: profile.admin_notes || undefined,
      orders: userOrders.map((order) => ({
        id: order.id,
        orderNumber: order.id,
        date: order.date,
        total: order.total,
        status: order.status,
        items: order.items.map((item) => ({ name: item.title, quantity: item.quantity, price: item.price })),
      })),
    }
  })

  const inquiries: InquiryItem[] = (inquiriesResult.data || []).map((item) => ({
    id: String(item.id || ''),
    name: String(item.name || ''),
    email: String(item.email || ''),
    phone: String(item.phone || ''),
    service: String(item.service || item.kind || ''),
    message: String(item.message || ''),
    date: String(item.created_at || ''),
    status: item.status === 'contacted' || item.status === 'resolved' ? item.status : 'new',
  }))

  return { ...content, orders, customers, inquiries }
}
