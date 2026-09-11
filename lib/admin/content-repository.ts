import 'server-only'

import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminPermission, type ValidAdminSession } from './session-server'
import type { BlogPostItem, CarItem, CategoryItem, CustomerItem, MultiLangString, ProductItem, SiteFullContent } from './types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/

function media(value: string | undefined, fallback: string) {
  if (!value) return fallback
  const clean = value.trim()
  if (!clean) return fallback
  if (
    clean.startsWith('/images/') ||
    clean.startsWith('/icon') ||
    clean.startsWith('https://') ||
    clean.startsWith('http://') ||
    clean.startsWith('data:image/') ||
    clean.startsWith('blob:') ||
    clean.startsWith('/')
  ) {
    return clean
  }
  return fallback
}

async function ensureHostedMedia(url: string | undefined, fallback: string, folder = 'uploads'): Promise<string> {
  const clean = media(url, fallback)
  if (!clean.startsWith('data:image/')) {
    return clean
  }
  try {
    const match = clean.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
    if (!match) return clean
    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const filePath = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
    const admin = createAdminClient()
    const { error } = await admin.storage
      .from('alifleet-media')
      .upload(filePath, buffer, { contentType: mimeType, upsert: true })
    if (error) {
      console.error('Failed to host base64 media:', error)
      return clean
    }
    const { data } = admin.storage.from('alifleet-media').getPublicUrl(filePath)
    return data.publicUrl
  } catch (err) {
    console.error('ensureHostedMedia error:', err)
    return clean
  }
}

function safeI18n(value?: MultiLangString | null, html = false): MultiLangString {
  const clean = (input?: string) => {
    if (!input) return ''
    return html
      ? sanitizeHtml(input, {
          allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
          allowedAttributes: { a: ['href', 'target', 'rel'] },
          allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        })
      : input.slice(0, 50_000)
  }
  return { ar: clean(value?.ar), en: clean(value?.en), he: clean(value?.he) }
}

async function syncCars(cars: CarItem[]) {
  const admin = createAdminClient()
  const rows = cars.map((car) => ({
    id: car.id, slug: car.id, type: car.type || 'sale', title: car.title || { ar: '', en: '', he: '' }, make: car.make || 'ALI FLEET', model: car.model || car.id,
    year: Number(car.year) || new Date().getFullYear(), price_minor: car.price == null ? null : Math.round(Number(car.price) * 100), currency: 'ILS',
    mileage: car.mileage || null, fuel: car.fuel || null, transmission: car.transmission || null, status: car.status || 'available',
    featured: Boolean(car.featured), origin: car.origin || null, condition: car.condition || null, import_stage: car.stage || null,
    previous_owners: car.previousOwners ?? null, eta: car.eta || null, availability: car.availability || null,
    specs: car.specs || {}, description: car.description || { ar: '', en: '', he: '' }, primary_image: car.image, published: true, archived_at: null,
  }))
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
      id: product.id, slug: product.id, sku: product.sku, name: product.name, category: product.category,
      category_id: product.categoryId || null,
      subcategory_id: product.subcategoryId || null,
      brand: product.brand || null, price_minor: Math.round(Number(product.price || 0) * 100), currency: 'ILS',
      stock_quantity: product.inStock ? Math.max(1, current?.stock_quantity || 25) : 0,
      max_order_quantity: current?.max_order_quantity || 10, featured: Boolean(product.featured),
      compatibility_summary: product.compatibility || '', description: product.description || { ar: '', en: '', he: '' }, primary_image: product.image,
      published: true, archived_at: null,
    }
  })
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
  const specRows = products.flatMap((product) => (product.specs || []).map((spec, index) => ({ product_id: product.id, label: typeof spec.label === 'string' ? { ar: spec.label, en: spec.label, he: spec.label } : spec.label, value: typeof spec.value === 'string' ? { ar: spec.value, en: spec.value, he: spec.value } : spec.value, sort_order: index })))
  const compatibilityRows = products.flatMap((product) => (product.compatibility || '').split(',').map((notes) => notes.trim()).filter(Boolean).map((notes) => ({ product_id: product.id, notes })))
  if (mediaRows.length) { const { error } = await admin.from('product_media').insert(mediaRows); if (error) throw error }
  if (specRows.length) { const { error } = await admin.from('product_specs').insert(specRows); if (error) throw error }
  if (compatibilityRows.length) { const { error } = await admin.from('product_compatibility').insert(compatibilityRows); if (error) throw error }
}

async function syncCategories(categories: CategoryItem[]) {
  validateCategoryHierarchy(categories)
  const admin = createAdminClient()
  const rows = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: safeI18n(category.name),
    description: category.description ? safeI18n(category.description) : null,
    parent_id: category.parentId || null,
    icon: category.icon || null,
    image: category.image ? media(category.image, '') : null,
    sort_order: Number(category.sortOrder) || 0,
    is_active: category.isActive !== false,
  }))

  const linkedProductsResult = await admin
    .from('products')
    .select('id,category_id,subcategory_id')
    .is('archived_at', null)
  if (linkedProductsResult.error) throw linkedProductsResult.error

  const byId = new Map(rows.map((category) => [category.id, category]))

  for (const product of linkedProductsResult.data || []) {
    if (product.category_id) {
      const mainCategory = byId.get(product.category_id)
      if (!mainCategory) throw new AdminContentError('category_in_use')
      if (mainCategory.parent_id) {
        throw new AdminContentError('linked_main_category_cannot_be_nested')
      }
    }
    if (product.subcategory_id) {
      const subcategory = byId.get(product.subcategory_id)
      if (!subcategory) throw new AdminContentError('category_in_use')
      if (!product.category_id || subcategory.parent_id !== product.category_id) {
        throw new AdminContentError('linked_subcategory_parent_mismatch')
      }
    }
  }

  const mainCategories = rows.filter((category) => !category.parent_id)
  const subcategories = rows.filter((category) => category.parent_id)
  if (mainCategories.length) {
    const { error } = await admin.from('categories').upsert(mainCategories)
    if (error) throw error
  }
  if (subcategories.length) {
    const { error } = await admin.from('categories').upsert(subcategories)
    if (error) throw error
  }

  for (const category of mainCategories) {
    const { error } = await admin
      .from('products')
      .update({ category: category.slug })
      .eq('category_id', category.id)
    if (error) throw error
  }

}

async function syncBlog(posts: BlogPostItem[]) {
  const admin = createAdminClient()
  const rows = posts.map((post) => ({
    id: post.id, slug: post.slug || post.id, title: post.title || { ar: '', en: '', he: '' }, excerpt: post.excerpt || { ar: '', en: '', he: '' }, content: post.content || null,
    author: post.author || 'ALI FLEET', author_avatar: post.authorAvatar || null, read_time: post.readTime || '5 min',
    cover_image: post.coverImage || post.image || null, tags: post.tags || [], category: post.category || 'news',
    featured: Boolean(post.featured), published: post.published !== false,
    published_at: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
  }))
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
  | 'categories'
  | 'blog'
  | 'orders'
  | 'customers'
  | 'inquiries'
  | 'settings'

const saveScopeSchema = z.enum([
  'pages',
  'cars',
  'products',
  'categories',
  'blog',
  'orders',
  'customers',
  'inquiries',
  'settings',
])
const objectArraySchema = z.array(z.record(z.string(), z.unknown())).max(5000)
const entityIdSchema = z.string().trim().regex(ID, 'invalid_entity_id')
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid_slug')
const i18nSchema = z.object({
  ar: z.string().max(50_000),
  en: z.string().max(50_000),
  he: z.string().max(50_000),
})
const requiredI18nSchema = i18nSchema.refine(
  (value) => Object.values(value).some((text) => text.trim().length > 0),
  'translation_required',
)
const categorySchema = z.object({
  id: entityIdSchema,
  slug: slugSchema,
  name: requiredI18nSchema,
  description: i18nSchema.optional(),
  parentId: entityIdSchema.nullable().optional(),
  icon: z.string().trim().max(80).optional(),
  image: z.string().max(5_000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(1_000_000),
  isActive: z.boolean(),
})
const productSpecSchema = z.object({
  label: z.union([i18nSchema, z.string().max(2_000)]),
  value: z.union([i18nSchema, z.string().max(2_000)]),
})
const productSchema = z.object({
  id: entityIdSchema,
  name: requiredI18nSchema,
  sku: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(120),
  categoryId: entityIdSchema.optional().or(z.literal('')),
  subcategoryId: entityIdSchema.optional().or(z.literal('')),
  brand: z.string().trim().max(200).optional(),
  price: z.coerce.number().finite().min(0).max(1_000_000_000),
  inStock: z.boolean(),
  featured: z.boolean().optional(),
  compatibility: z.string().max(20_000),
  image: z.string().max(5_000),
  images: z.array(z.string().max(5_000)).max(100).optional(),
  specs: z.array(productSpecSchema).max(200).optional(),
  description: i18nSchema,
})

export class AdminContentError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

function validateCategoryHierarchy(categories: CategoryItem[]) {
  const ids = new Set<string>()
  const slugs = new Set<string>()
  for (const category of categories) {
    if (ids.has(category.id)) throw new AdminContentError('duplicate_category_id')
    if (slugs.has(category.slug)) throw new AdminContentError('duplicate_category_slug')
    ids.add(category.id)
    slugs.add(category.slug)
  }

  const byId = new Map(categories.map((category) => [category.id, category]))
  for (const category of categories) {
    if (!category.parentId) continue
    if (category.parentId === category.id) {
      throw new AdminContentError('category_cannot_parent_itself')
    }
    const parent = byId.get(category.parentId)
    if (!parent) throw new AdminContentError('category_parent_missing')
    if (parent.parentId) throw new AdminContentError('category_depth_exceeded')
  }
}

async function normalizeProductCategoryLinks(products: ProductItem[]) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('categories')
    .select('id,slug,parent_id')
  if (error) throw error

  const categories = data || []
  const byId = new Map(categories.map((category) => [category.id, category]))
  const mainBySlug = new Map(
    categories
      .filter((category) => !category.parent_id)
      .map((category) => [category.slug, category]),
  )

  return products.map((product) => {
    const requestedMain = product.categoryId
      ? byId.get(product.categoryId)
      : mainBySlug.get(product.category)
    if (!requestedMain || requestedMain.parent_id) {
      throw new AdminContentError('product_main_category_invalid')
    }

    const requestedSubcategory = product.subcategoryId
      ? byId.get(product.subcategoryId)
      : undefined
    if (
      product.subcategoryId &&
      (!requestedSubcategory || requestedSubcategory.parent_id !== requestedMain.id)
    ) {
      throw new AdminContentError('product_subcategory_invalid')
    }

    return {
      ...product,
      category: requestedMain.slug,
      categoryId: requestedMain.id,
      subcategoryId: requestedSubcategory?.id,
    }
  })
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
  const policySlugs: Record<string, string> = { privacy: 'privacy-policy', terms: 'terms', refund: 'return-policy' }
  const policies = Array.isArray(parsed.pages.policies)
    ? (parsed.pages.policies as SiteFullContent['pages']['policies']).map((policy) => {
        const id = (policy.id || 'privacy') as 'privacy' | 'terms' | 'refund'
        const slug = policySlugs[id] || id
        return {
          id,
          slug,
          title: safeI18n(policy.title),
          content: safeI18n(policy.content, true),
          last_updated: policy.lastUpdated || new Date().toISOString().slice(0, 10),
          published: true,
        }
      })
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
  if (scope === 'settings') {
    await requireAdminPermission('settings.write')
  } else if (['pages', 'cars', 'products', 'categories', 'blog'].includes(scope)) {
    await requireAdminPermission('content.write')
  } else {
    await requireAdminPermission('operations.write')
  }

  if (scope === 'pages') await savePagesScope(data)
  if (scope === 'cars') {
    const cars = objectArraySchema.max(500).parse(data) as unknown as CarItem[]
    const processedCars = await Promise.all(
      cars
        .filter((car) => car.id && typeof car.id === 'string' && car.id.trim().length > 0)
        .map(async (car) => {
          const image = await ensureHostedMedia(car.image, '/images/fleet-truck.png', 'cars')
          const images = await Promise.all(
            (car.images || []).map((img) => ensureHostedMedia(img, image, 'cars'))
          )
          return {
            ...car,
            id: car.id.trim(),
            image,
            images,
            title: safeI18n(car.title),
            description: safeI18n(car.description),
          }
        })
    )
    await syncCars(processedCars)
  }
  if (scope === 'products') {
    const products = z.array(productSchema).max(2000).parse(data) as unknown as ProductItem[]
    const normalizedProducts = await normalizeProductCategoryLinks(products)
    const processedProducts = await Promise.all(
      normalizedProducts.map(async (product) => {
        const image = await ensureHostedMedia(product.image, '/images/part-brake-pads.png', 'products')
        const images = await Promise.all(
          (product.images || []).map((item) => ensureHostedMedia(item, image, 'products')),
        )
        return {
          ...product,
          image,
          images,
          name: safeI18n(product.name),
          description: safeI18n(product.description),
        }
      }),
    )
    await syncProducts(processedProducts)
  }
  if (scope === 'categories') {
    const categories = z.array(categorySchema).max(1000).parse(data) as CategoryItem[]
    validateCategoryHierarchy(categories)
    const processedCategories = await Promise.all(
      categories.map(async (category) => {
        const image = category.image
          ? await ensureHostedMedia(category.image, '', 'categories')
          : undefined
        return {
          ...category,
          image,
          name: safeI18n(category.name),
          description: category.description
            ? safeI18n(category.description)
            : undefined,
        }
      }),
    )
    await syncCategories(processedCategories)
  }
  if (scope === 'blog') {
    const posts = objectArraySchema.max(1000).parse(data) as unknown as BlogPostItem[]
    const processedPosts = await Promise.all(
      posts
        .filter((post) => post.id && typeof post.id === 'string' && post.id.trim().length > 0)
        .map(async (post) => {
          const coverImage = await ensureHostedMedia(post.coverImage || post.image, '/images/blog-hero.png', 'blog')
          const authorAvatar = await ensureHostedMedia(post.authorAvatar, '/images/hero-avatars.png', 'authors')
          return {
            ...post,
            id: post.id.trim(),
            slug: (post.slug && post.slug.trim().length > 0 ? post.slug.trim() : post.id.trim()).replace(/\s+/g, '-'),
            coverImage,
            image: coverImage,
            authorAvatar,
            title: safeI18n(post.title),
            excerpt: safeI18n(post.excerpt),
            content: post.content ? safeI18n(post.content, true) : undefined,
          }
        })
    )
    await syncBlog(processedPosts)
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
