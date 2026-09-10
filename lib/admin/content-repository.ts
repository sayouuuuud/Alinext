import 'server-only'

import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import type { ValidAdminSession } from './session-server'
import type { BlogPostItem, CarItem, CustomerItem, MultiLangString, ProductItem, SiteFullContent } from './types'

const contentSchema = z.object({
  version: z.number(),
  pages: z.object({ home: z.record(z.string(), z.unknown()) }).passthrough(),
  cars: z.array(z.object({ id: z.string().min(1).max(120) }).passthrough()).max(500),
  products: z.array(z.object({ id: z.string().min(1).max(120), sku: z.string().min(1).max(120) }).passthrough()).max(2000),
  blog: z.array(z.object({ id: z.string().min(1).max(120) }).passthrough()).max(1000),
  orders: z.array(z.unknown()).max(5000),
  customers: z.array(z.unknown()).max(5000),
}).passthrough()

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

function sanitizedContent(input: SiteFullContent): SiteFullContent {
  const parsed = contentSchema.parse(input) as SiteFullContent
  const content = structuredClone(parsed)
  delete content.security.passwordHash
  content.version = 5
  content.lastSaved = new Date().toISOString()
  content.commerce.enableCardPayment = false
  content.commerce.enableCardPayments = false
  content.commerce.enablePaypal = false
  content.branding.logoLightUrl = media(content.branding.logoLightUrl, '/images/ali-fleet-logo.png')
  content.branding.logoDarkUrl = media(content.branding.logoDarkUrl, '/images/ali-fleet-logo.png')
  content.branding.faviconUrl = media(content.branding.faviconUrl, '/icon.svg')
  content.cars = content.cars.filter((item) => ID.test(item.id)).map((car) => ({
    ...car,
    image: media(car.image, '/images/fleet-truck.png'),
    images: (car.images || []).map((image) => media(image, car.image || '/images/fleet-truck.png')),
    title: safeI18n(car.title),
    description: safeI18n(car.description),
  }))
  content.products = content.products.filter((item) => ID.test(item.id)).map((product) => ({
    ...product,
    image: media(product.image, '/images/part-brake-pads.png'),
    images: (product.images || []).map((image) => media(image, product.image || '/images/part-brake-pads.png')),
    name: safeI18n(product.name),
    description: safeI18n(product.description),
  }))
  content.blog = content.blog.filter((item) => ID.test(item.id)).map((post) => ({
    ...post,
    coverImage: media(post.coverImage || post.image, '/images/blog-hero.png'),
    image: media(post.image || post.coverImage, '/images/blog-hero.png'),
    authorAvatar: media(post.authorAvatar, '/images/hero-avatars.png'),
    title: safeI18n(post.title),
    excerpt: safeI18n(post.excerpt),
    content: post.content ? safeI18n(post.content, true) : undefined,
  }))
  return content
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

async function syncSettings(content: SiteFullContent, actorId: string) {
  const admin = createAdminClient()
  const taxRate = Number(content.commerce.vatPercentage ?? content.commerce.taxRatePercent ?? 17)
  const freeShipping = Number(content.commerce.freeDeliveryThreshold ?? content.commerce.freeShippingThreshold ?? 500)
  const publicSettings = [
    { key: 'branding', value: content.branding }, { key: 'contact', value: content.general.contact },
    { key: 'social', value: content.general.social }, { key: 'navigation', value: content.general.navigation || {} },
    { key: 'footer', value: content.general.footer || {} }, { key: 'maintenance', value: content.maintenance },
    { key: 'seo', value: content.seo },
    { key: 'commerce', value: { currency: 'ILS', currency_symbol: content.general.currency || '₪', tax_rate_percent: taxRate, free_shipping_threshold_minor: Math.round(freeShipping * 100), shipping_flat_minor: 5000, online_payments_enabled: false, cod_enabled: true, bank_transfer_enabled: Boolean(content.commerce.enableBankTransfer) } },
  ]
  const privateSettings = [
    { key: 'notifications', value: content.notifications || {} },
    { key: 'admin_security', value: { session_timeout_minutes: Number(content.security.sessionTimeoutMinutes || 60), notify_on_new_login: Boolean(content.security.notifyOnNewLogin) } },
  ]
  const pageRows = Object.entries(content.pages).flatMap(([pageKey, page]) => {
    if (!page || typeof page !== 'object' || pageKey === 'policies') return []
    return Object.entries(page).filter(([sectionKey]) => sectionKey !== 'policies').map(([sectionKey, sectionContent], sortOrder) => ({ page_key: pageKey, section_key: sectionKey, content: sectionContent, sort_order: sortOrder, published: true }))
  })
  const policySlugs = { privacy: 'privacy-policy', terms: 'terms', refund: 'return-policy' }
  const policies = content.pages.policies.map((policy) => ({ id: policy.id, slug: policySlugs[policy.id], title: policy.title, content: safeI18n(policy.content, true), last_updated: policy.lastUpdated, published: true }))

  const results = await Promise.all([
    admin.from('site_settings_public').upsert(publicSettings),
    admin.from('site_settings_private').upsert(privateSettings),
    pageRows.length ? admin.from('page_sections').upsert(pageRows, { onConflict: 'page_key,section_key' }) : Promise.resolve({ error: null }),
    policies.length ? admin.from('policy_pages').upsert(policies) : Promise.resolve({ error: null }),
  ])
  const error = results.find((result) => result.error)?.error
  if (error) throw error

  const documentPayload: SiteFullContent = { ...content, orders: [], customers: [], inquiries: [] }
  const { error: contentError } = await admin.from('site_content').upsert({ id: 1, payload: documentPayload, version: 6, updated_by: actorId })
  if (contentError) throw contentError
}

const transitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'], delivered: ['completed'], cancelled: [], completed: [],
}

async function syncOperations(content: SiteFullContent) {
  const admin = createAdminClient()
  const { data: currentOrders, error: orderError } = await admin.from('orders').select('order_number,status')
  if (orderError) throw orderError
  const currentByNumber = new Map((currentOrders || []).map((order) => [order.order_number, order.status]))
  for (const order of content.orders) {
    const current = currentByNumber.get(order.id)
    if (!current) continue
    if (order.status !== current && !transitions[current]?.includes(order.status)) throw new Error(`Invalid order transition: ${current} -> ${order.status}`)
    const { error } = await admin.from('orders').update({
      status: order.status, tracking_number: order.trackingNumber || null, carrier: order.carrier || null,
      estimated_delivery: order.estimatedDelivery || null, admin_notes: order.notes || null, payment_status: order.paymentStatus,
    }).eq('order_number', order.id)
    if (error) throw error
  }

  for (const customer of content.customers) {
    let userId = customer.id
    if (!UUID.test(userId)) {
      const invitation = await admin.auth.admin.inviteUserByEmail(customer.email, {
        data: { display_name: customer.name, phone: customer.phone, preferred_locale: 'ar' },
        ...(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ? { redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL } : {}),
      })
      if (invitation.error) throw invitation.error
      userId = invitation.data.user.id
    }
    const { error } = await admin.from('profiles').update({
      display_name: customer.name.slice(0, 120), phone: customer.phone.slice(0, 40), tier: customer.tier,
      status: customer.status, interested_in: customer.interestedIn || null, admin_notes: customer.notes || null,
    }).eq('id', userId)
    if (error) throw error
    const banResult = await admin.auth.admin.updateUserById(userId, { ban_duration: customer.status === 'suspended' ? '876000h' : 'none' })
    if (banResult.error) throw banResult.error
  }

  for (const inquiry of content.inquiries || []) {
    if (!UUID.test(inquiry.id)) continue
    const { error } = await admin.from('inquiries').update({ status: inquiry.status }).eq('id', inquiry.id)
    if (error) throw error
  }
}

export async function saveAdminContent(input: SiteFullContent, session: ValidAdminSession) {
  const content = sanitizedContent(input)
  if (session.role === 'owner' || session.role === 'content_editor') {
    await syncCars(content.cars)
    await syncProducts(content.products)
    await syncBlog(content.blog)
    await syncSettings(content, session.userId)
  }
  if (session.role === 'owner' || session.role === 'operations') await syncOperations(content)
  const { error } = await createAdminClient().from('admin_audit_log').insert({
    actor_id: session.userId, action: 'content.save', entity_type: 'site_content', entity_id: '1',
    after_value: { role: session.role, cars: content.cars.length, products: content.products.length, blog: content.blog.length, orders: content.orders.length },
  })
  if (error) throw error
  return content
}
