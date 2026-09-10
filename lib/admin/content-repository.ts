import 'server-only'

import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import type { ValidAdminSession } from './session-server'
import type { BlogPostItem, CarItem, CustomerItem, MultiLangString, ProductItem, SiteFullContent } from './types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/

function media(value: string | undefined, fallback: string) {
  if (!value) return fallback
  const clean = value.trim()
  return clean.startsWith('/images/') || clean.startsWith('/icon') || clean.startsWith('https://') ? clean : fallback
}

function safeI18n(value: MultiLangString, html = false): MultiLangString {
  const clean = (input: string) => html
    ? sanitizeHtml(input, {
        allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
        allowedAttributes: { a: ['href', 'target', 'rel'] },
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      })
    : input.slice(0, 50_000)
  return { ar: clean(value.ar || ''), en: clean(value.en || ''), he: clean(value.he || '') }
}

async function syncCars(cars: CarItem[]) {
  const admin = createAdminClient()
  const rows = cars.map((car) => ({
    id: car.id, slug: car.id, type: car.type, title: car.title, make: car.make || 'ALI FLEET', model: car.model || car.id,
    year: Number(car.year), price_minor: car.price == null ? null : Math.round(Number(car.price) * 100), currency: 'ILS',
    mileage: car.mileage || null, fuel: car.fuel || null, transmission: car.transmission || null, status: car.status,
    featured: Boolean(car.featured), origin: car.origin || null, condition: car.condition || null, import_stage: car.stage || null,
    previous_owners: car.previousOwners ?? null, eta: car.eta || null, availability: car.availability || null,
    specs: car.specs || {}, description: car.description, primary_image: car.image, published: true, archived_at: null,
  }))
  const { data: existing, error: existingError } = await admin.from('cars').select('id')
  if (existingError) throw existingError
  const activeIds = new Set(rows.map((row) => row.id))
  const removed = (existing || []).map((row) => row.id).filter((id) => !activeIds.has(id))
  if (removed.length) {
    const { error } = await admin.from('cars').update({ archived_at: new Date().toISOString(), published: false }).in('id', removed)
    if (error) throw error
  }
  if (!rows.length) return
  const { error: upsertError } = await admin.from('cars').upsert(rows)
  if (upsertError) throw upsertError
  const ids = rows.map((row) => row.id)
  const [mediaDelete, highlightsDelete] = await Promise.all([
    admin.from('car_media').delete().in('car_id', ids),
    admin.from('car_highlights').delete().in('car_id', ids),
  ])
  if (mediaDelete.error) throw mediaDelete.error
  if (highlightsDelete.error) throw highlightsDelete.error
  const mediaRows = cars.flatMap((car) => [...new Set([car.image, ...(car.images || [])].filter(Boolean))].map((url, index) => ({ car_id: car.id, url, alt: car.title, sort_order: index })))
  const highlightRows = cars.flatMap((car) => (car.highlights || []).map((content, index) => ({ car_id: car.id, content, sort_order: index })))
  if (mediaRows.length) { const { error } = await admin.from('car_media').insert(mediaRows); if (error) throw error }
  if (highlightRows.length) { const { error } = await admin.from('car_highlights').insert(highlightRows); if (error) throw error }
}

async function syncProducts(products: ProductItem[]) {
  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin.from('products').select('id,stock_quantity,max_order_quantity')
  if (existingError) throw existingError
  const byId = new Map((existing || []).map((row) => [row.id, row]))
  const rows = products.map((product) => {
    const current = byId.get(product.id)
    return {
      id: product.id, slug: product.id, sku: product.sku, name: product.name, category: product.category || 'other',
      brand: product.brand || null, price_minor: Math.round(Number(product.price || 0) * 100), currency: 'ILS',
      stock_quantity: product.inStock ? Math.max(1, current?.stock_quantity || 25) : 0,
      max_order_quantity: current?.max_order_quantity || 10, featured: Boolean(product.featured),
      compatibility_summary: product.compatibility || '', description: product.description, primary_image: product.image,
      published: true, archived_at: null,
    }
  })
  const activeIds = new Set(rows.map((row) => row.id))
  const removed = (existing || []).map((row) => row.id).filter((id) => !activeIds.has(id))
  if (removed.length) {
    const { error } = await admin.from('products').update({ archived_at: new Date().toISOString(), published: false }).in('id', removed)
    if (error) throw error
  }
  if (!rows.length) return
  const { error: upsertError } = await admin.from('products').upsert(rows)
  if (upsertError) throw upsertError
  const ids = rows.map((row) => row.id)
  const [mediaDelete, specsDelete, compatibilityDelete] = await Promise.all([
    admin.from('product_media').delete().in('product_id', ids),
    admin.from('product_specs').delete().in('product_id', ids),
    admin.from('product_compatibility').delete().in('product_id', ids),
  ])
  if (mediaDelete.error) throw mediaDelete.error
  if (specsDelete.error) throw specsDelete.error
  if (compatibilityDelete.error) throw compatibilityDelete.error
  const mediaRows = products.flatMap((product) => [...new Set([product.image, ...(product.images || [])].filter(Boolean))].map((url, index) => ({ product_id: product.id, url, alt: product.name, sort_order: index })))
  const specRows = products.flatMap((product) => (product.specs || []).map((spec, index) => ({ product_id: product.id, label: spec.label, value: spec.value, sort_order: index })))
  const compatibilityRows = products.flatMap((product) => product.compatibility.split(',').map((notes) => notes.trim()).filter(Boolean).map((notes) => ({ product_id: product.id, notes })))
  if (mediaRows.length) { const { error } = await admin.from('product_media').insert(mediaRows); if (error) throw error }
  if (specRows.length) { const { error } = await admin.from('product_specs').insert(specRows); if (error) throw error }
  if (compatibilityRows.length) { const { error } = await admin.from('product_compatibility').insert(compatibilityRows); if (error) throw error }
}

async function syncBlog(posts: BlogPostItem[]) {
  const admin = createAdminClient()
  const rows = posts.map((post) => ({
    id: post.id, slug: post.slug || post.id, title: post.title, excerpt: post.excerpt, content: post.content || null,
    author: post.author || 'ALI FLEET', author_avatar: post.authorAvatar || null, read_time: post.readTime || '5 min',
    cover_image: post.coverImage || post.image || null, tags: post.tags || [], category: post.category || 'news',
    featured: Boolean(post.featured), published: post.published !== false,
    published_at: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
  }))
  const { data: existing, error: existingError } = await admin.from('blog_posts').select('id')
  if (existingError) throw existingError
  const activeIds = new Set(rows.map((row) => row.id))
  const removed = (existing || []).map((row) => row.id).filter((id) => !activeIds.has(id))
  if (removed.length) { const { error } = await admin.from('blog_posts').update({ published: false }).in('id', removed); if (error) throw error }
  if (rows.length) { const { error } = await admin.from('blog_posts').upsert(rows); if (error) throw error }
}

const transitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'], delivered: ['completed'], cancelled: [], completed: [],
}

export type AdminSaveScope =
  | 'pages'
  | 'cars'
  | 'products'
  | 'blog'
  | 'orders'
  | 'customers'
  | 'inquiries'
  | 'settings'

const saveScopeSchema = z.enum([
  'pages',
  'cars',
  'products',
  'blog',
  'orders',
  'customers',
  'inquiries',
  'settings',
])
const objectArraySchema = z.array(z.record(z.string(), z.unknown())).max(5000)

function requireContentRole(session: ValidAdminSession) {
  if (session.role !== 'owner' && session.role !== 'content_editor') {
    throw new Error('insufficient_role')
  }
}

function requireOperationsRole(session: ValidAdminSession) {
  if (session.role !== 'owner' && session.role !== 'operations') {
    throw new Error('insufficient_role')
  }
}

async function savePagesScope(data: unknown) {
  const parsed = z.object({
    pages: z.record(z.string(), z.unknown()),
    general: z.object({
      contact: z.record(z.string(), z.unknown()),
      social: z.record(z.string(), z.unknown()),
      navigation: z.record(z.string(), z.unknown()).optional(),
      footer: z.record(z.string(), z.unknown()).optional(),
    }),
  }).parse(data)
  const admin = createAdminClient()
  const pageRows = Object.entries(parsed.pages).flatMap(([pageKey, page]) => {
    if (!page || typeof page !== 'object' || pageKey === 'policies') return []
    return Object.entries(page).map(([sectionKey, sectionContent], sortOrder) => ({
      page_key: pageKey,
      section_key: sectionKey,
      content: sectionContent,
      sort_order: sortOrder,
      published: true,
    }))
  })
  const policySlugs = { privacy: 'privacy-policy', terms: 'terms', refund: 'return-policy' }
  const policies = Array.isArray(parsed.pages.policies)
    ? (parsed.pages.policies as SiteFullContent['pages']['policies']).map((policy) => ({
        id: policy.id,
        slug: policySlugs[policy.id],
        title: safeI18n(policy.title),
        content: safeI18n(policy.content, true),
        last_updated: policy.lastUpdated,
        published: true,
      }))
    : []
  const results = await Promise.all([
    admin.from('site_settings_public').upsert([
      { key: 'contact', value: parsed.general.contact },
      { key: 'social', value: parsed.general.social },
      { key: 'navigation', value: parsed.general.navigation || {} },
      { key: 'footer', value: parsed.general.footer || {} },
    ]),
    pageRows.length
      ? admin.from('page_sections').upsert(pageRows, { onConflict: 'page_key,section_key' })
      : Promise.resolve({ error: null }),
    policies.length
      ? admin.from('policy_pages').upsert(policies)
      : Promise.resolve({ error: null }),
  ])
  const error = results.find((result) => result.error)?.error
  if (error) throw error
}

async function saveSettingsScope(data: unknown) {
  const parsed = z.object({
    branding: z.record(z.string(), z.unknown()),
    commerce: z.record(z.string(), z.unknown()),
    seo: z.record(z.string(), z.unknown()),
    maintenance: z.record(z.string(), z.unknown()),
    notifications: z.record(z.string(), z.unknown()),
    security: z.record(z.string(), z.unknown()),
    currency: z.string().max(12),
  }).parse(data)
  const branding = parsed.branding as unknown as SiteFullContent['branding']
  branding.logoLightUrl = media(branding.logoLightUrl, '/images/ali-fleet-logo.png')
  branding.logoDarkUrl = media(branding.logoDarkUrl, '/images/ali-fleet-logo.png')
  branding.faviconUrl = media(branding.faviconUrl, '/icon.svg')
  const commerce = parsed.commerce as unknown as SiteFullContent['commerce']
  const taxRate = Math.min(100, Math.max(0, Number(commerce.vatPercentage ?? commerce.taxRatePercent ?? 17)))
  const freeShipping = Math.max(0, Number(commerce.freeDeliveryThreshold ?? commerce.freeShippingThreshold ?? 500))
  const security = parsed.security as unknown as SiteFullContent['security']
  const admin = createAdminClient()
  const results = await Promise.all([
    admin.from('site_settings_public').upsert([
      { key: 'branding', value: branding },
      { key: 'maintenance', value: parsed.maintenance },
      { key: 'seo', value: parsed.seo },
      {
        key: 'commerce',
        value: {
          currency: 'ILS',
          currency_symbol: parsed.currency || '₪',
          tax_rate_percent: taxRate,
          free_shipping_threshold_minor: Math.round(freeShipping * 100),
          shipping_flat_minor: 5000,
          online_payments_enabled: false,
          cod_enabled: true,
          bank_transfer_enabled: Boolean(commerce.enableBankTransfer),
        },
      },
    ]),
    admin.from('site_settings_private').upsert([
      { key: 'notifications', value: parsed.notifications },
      {
        key: 'admin_security',
        value: {
          session_timeout_minutes: Math.min(480, Math.max(15, Number(security.sessionTimeoutMinutes || 60))),
          notify_on_new_login: Boolean(security.notifyOnNewLogin),
        },
      },
    ]),
  ])
  const error = results.find((result) => result.error)?.error
  if (error) throw error
}

async function saveOrdersScope(data: unknown) {
  const orders = objectArraySchema.max(5000).parse(data) as unknown as SiteFullContent['orders']
  const admin = createAdminClient()
  const { data: currentOrders, error: lookupError } = await admin.from('orders').select('order_number,status')
  if (lookupError) throw lookupError
  const currentByNumber = new Map((currentOrders || []).map((order) => [order.order_number, order.status]))
  for (const order of orders) {
    const current = currentByNumber.get(order.id)
    if (!current) continue
    if (order.status !== current && !transitions[current]?.includes(order.status)) {
      throw new Error(`Invalid order transition: ${current} -> ${order.status}`)
    }
    const { error } = await admin.from('orders').update({
      status: order.status,
      tracking_number: order.trackingNumber || null,
      carrier: order.carrier || null,
      estimated_delivery: order.estimatedDelivery || null,
      admin_notes: order.notes || null,
      payment_status: order.paymentStatus,
    }).eq('order_number', order.id)
    if (error) throw error
  }
}

async function saveCustomersScope(data: unknown) {
  const customers = objectArraySchema.max(5000).parse(data) as unknown as CustomerItem[]
  const admin = createAdminClient()
  for (const customer of customers) {
    let userId = customer.id
    if (!UUID.test(userId)) {
      const invitation = await admin.auth.admin.inviteUserByEmail(customer.email, {
        data: { display_name: customer.name, phone: customer.phone, preferred_locale: 'ar' },
        ...(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
          ? { redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL }
          : {}),
      })
      if (invitation.error) throw invitation.error
      userId = invitation.data.user.id
    }
    const { error } = await admin.from('profiles').update({
      display_name: customer.name.slice(0, 120),
      phone: customer.phone.slice(0, 40),
      tier: customer.tier,
      status: customer.status,
      interested_in: customer.interestedIn || null,
      admin_notes: customer.notes || null,
    }).eq('id', userId)
    if (error) throw error
    const banResult = await admin.auth.admin.updateUserById(userId, {
      ban_duration: customer.status === 'suspended' ? '876000h' : 'none',
    })
    if (banResult.error) throw banResult.error
  }
}

async function saveInquiriesScope(data: unknown) {
  const inquiries = objectArraySchema.max(5000).parse(data) as unknown as NonNullable<SiteFullContent['inquiries']>
  const admin = createAdminClient()
  for (const inquiry of inquiries) {
    if (!UUID.test(inquiry.id)) continue
    const { error } = await admin.from('inquiries').update({ status: inquiry.status }).eq('id', inquiry.id)
    if (error) throw error
  }
}

export async function saveAdminSection(
  rawScope: unknown,
  data: unknown,
  session: ValidAdminSession,
) {
  const scope = saveScopeSchema.parse(rawScope)
  if (['pages', 'cars', 'products', 'blog', 'settings'].includes(scope)) {
    requireContentRole(session)
  } else {
    requireOperationsRole(session)
  }

  if (scope === 'pages') await savePagesScope(data)
  if (scope === 'cars') {
    const cars = objectArraySchema.max(500).parse(data) as unknown as CarItem[]
    await syncCars(cars.filter((car) => ID.test(car.id)).map((car) => ({
      ...car,
      image: media(car.image, '/images/fleet-truck.png'),
      images: (car.images || []).map((image) => media(image, car.image || '/images/fleet-truck.png')),
      title: safeI18n(car.title),
      description: safeI18n(car.description),
    })))
  }
  if (scope === 'products') {
    const products = objectArraySchema.max(2000).parse(data) as unknown as ProductItem[]
    await syncProducts(products.filter((product) => ID.test(product.id) && ID.test(product.sku)).map((product) => ({
      ...product,
      image: media(product.image, '/images/part-brake-pads.png'),
      images: (product.images || []).map((image) => media(image, product.image || '/images/part-brake-pads.png')),
      name: safeI18n(product.name),
      description: safeI18n(product.description),
    })))
  }
  if (scope === 'blog') {
    const posts = objectArraySchema.max(1000).parse(data) as unknown as BlogPostItem[]
    await syncBlog(posts.filter((post) => ID.test(post.id) && ID.test(post.slug || post.id)).map((post) => ({
      ...post,
      coverImage: media(post.coverImage || post.image, '/images/blog-hero.png'),
      image: media(post.image || post.coverImage, '/images/blog-hero.png'),
      authorAvatar: media(post.authorAvatar, '/images/hero-avatars.png'),
      title: safeI18n(post.title),
      excerpt: safeI18n(post.excerpt),
      content: post.content ? safeI18n(post.content, true) : undefined,
    })))
  }
  if (scope === 'orders') await saveOrdersScope(data)
  if (scope === 'customers') await saveCustomersScope(data)
  if (scope === 'inquiries') await saveInquiriesScope(data)
  if (scope === 'settings') await saveSettingsScope(data)

  const { error } = await createAdminClient().from('admin_audit_log').insert({
    actor_id: session.userId,
    action: `${scope}.save`,
    entity_type: scope,
    entity_id: null,
    after_value: { role: session.role },
  })
  if (error) throw error
  return { scope, lastSaved: new Date().toISOString() }
}
