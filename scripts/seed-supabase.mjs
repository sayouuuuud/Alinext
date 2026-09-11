import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  throw new Error('Supabase environment variables are required')
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const source = JSON.parse(
  await readFile(resolve(process.cwd(), 'data/site-content.json'), 'utf8'),
)

function allowedMedia(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const media = value.trim()
  if (media.startsWith('/images/') || media.startsWith('/icon') || media.startsWith('https://')) {
    return media
  }
  return fallback
}

const content = structuredClone(source)
delete content.security?.passwordHash
content.version = 6
content.lastSaved = new Date().toISOString()
content.commerce = {
  ...content.commerce,
  enableCardPayment: false,
  enableCardPayments: false,
  enablePaypal: false,
  enableCod: true,
  enableCashOnDelivery: true,
}
content.branding.logoLightUrl = allowedMedia(content.branding.logoLightUrl, '/images/ali-fleet-logo.png')
content.branding.logoDarkUrl = allowedMedia(content.branding.logoDarkUrl, '/images/ali-fleet-logo.png')
content.branding.faviconUrl = allowedMedia(content.branding.faviconUrl, '/icon.svg')

for (const car of content.cars) {
  car.image = allowedMedia(car.image, '/images/fleet-truck.png')
  car.images = (car.images || []).map((image) => allowedMedia(image, car.image))
}
for (const product of content.products) {
  product.image = allowedMedia(product.image, '/images/part-brake-pads.png')
  product.images = (product.images || []).map((image) => allowedMedia(image, product.image))
}
for (const post of content.blog) {
  post.coverImage = allowedMedia(post.coverImage || post.image, '/images/blog-hero.png')
  post.image = allowedMedia(post.image || post.coverImage, post.coverImage)
  post.authorAvatar = allowedMedia(post.authorAvatar, '/images/hero-avatars.png')
}

async function assertResult(operation, result) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`)
  return result.data
}

await assertResult(
  'site_content',
  await supabase.from('site_content').upsert({ id: 1, payload: content, version: 6 }),
)

const taxRate = Number(content.commerce.vatPercentage ?? content.commerce.taxRatePercent ?? 17)
const freeShipping = Number(
  content.commerce.freeDeliveryThreshold ?? content.commerce.freeShippingThreshold ?? 500,
)

await assertResult(
  'site_settings_public',
  await supabase.from('site_settings_public').upsert([
    { key: 'branding', value: content.branding },
    { key: 'contact', value: content.general.contact },
    { key: 'social', value: content.general.social },
    { key: 'navigation', value: content.general.navigation || {} },
    { key: 'footer', value: content.general.footer || {} },
    { key: 'maintenance', value: content.maintenance },
    { key: 'seo', value: content.seo },
    {
      key: 'commerce',
      value: {
        currency: 'ILS',
        currency_symbol: content.general.currency || '₪',
        tax_rate_percent: taxRate,
        free_shipping_threshold_minor: Math.round(freeShipping * 100),
        shipping_flat_minor: 5000,
        online_payments_enabled: false,
        cod_enabled: true,
        bank_transfer_enabled: Boolean(content.commerce.enableBankTransfer),
      },
    },
  ]),
)

await assertResult(
  'site_settings_private',
  await supabase.from('site_settings_private').upsert([
    { key: 'notifications', value: content.notifications || {} },
    {
      key: 'admin_security',
      value: {
        session_timeout_minutes: Number(content.security?.sessionTimeoutMinutes || 60),
        notify_on_new_login: Boolean(content.security?.notifyOnNewLogin),
      },
    },
  ]),
)

const pageRows = []
for (const [pageKey, page] of Object.entries(content.pages || {})) {
  if (!page || typeof page !== 'object') continue
  let sortOrder = 0
  for (const [sectionKey, sectionContent] of Object.entries(page)) {
    if (pageKey === 'policies' || sectionKey === 'policies') continue
    pageRows.push({
      page_key: pageKey,
      section_key: sectionKey,
      content: sectionContent,
      sort_order: sortOrder++,
      published: true,
    })
  }
}
if (pageRows.length) {
  await assertResult(
    'page_sections',
    await supabase.from('page_sections').upsert(pageRows, { onConflict: 'page_key,section_key' }),
  )
}

const policySlugs = { privacy: 'privacy-policy', terms: 'terms', refund: 'return-policy' }
const policies = (content.pages?.policies || []).map((policy) => ({
  id: policy.id,
  slug: policySlugs[policy.id] || policy.id,
  title: policy.title,
  content: policy.content,
  last_updated: policy.lastUpdated || new Date().toISOString().slice(0, 10),
  published: true,
}))
if (policies.length) {
  await assertResult('policy_pages', await supabase.from('policy_pages').upsert(policies))
}

const carRows = content.cars.map((car) => ({
  id: car.id,
  slug: car.id,
  type: car.type,
  title: car.title,
  make: car.make || 'ALI FLEET',
  model: car.model || car.id,
  year: Number(car.year || new Date().getFullYear()),
  price_minor: car.price == null ? null : Math.round(Number(car.price) * 100),
  currency: 'ILS',
  mileage: car.mileage || null,
  fuel: car.fuel || null,
  transmission: car.transmission || null,
  status: car.status || 'available',
  featured: Boolean(car.featured),
  origin: car.origin || null,
  condition: car.condition || null,
  import_stage: car.stage || null,
  previous_owners: car.previousOwners ?? null,
  eta: car.eta || null,
  availability: car.availability || null,
  specs: car.specs || {},
  description: car.description,
  primary_image: car.image,
  published: true,
}))
await assertResult('cars', await supabase.from('cars').upsert(carRows))

const carIds = carRows.map((car) => car.id)
if (carIds.length) {
  await assertResult('car_media cleanup', await supabase.from('car_media').delete().in('car_id', carIds))
  await assertResult('car_highlights cleanup', await supabase.from('car_highlights').delete().in('car_id', carIds))
}
const carMedia = content.cars.flatMap((car) => {
  const images = [...new Set([car.image, ...(car.images || [])].filter(Boolean))]
  return images.map((image, index) => ({ car_id: car.id, url: image, alt: car.title, sort_order: index }))
})
const carHighlights = content.cars.flatMap((car) =>
  (car.highlights || []).map((highlight, index) => ({ car_id: car.id, content: highlight, sort_order: index })),
)
if (carMedia.length) await assertResult('car_media', await supabase.from('car_media').insert(carMedia))
if (carHighlights.length) await assertResult('car_highlights', await supabase.from('car_highlights').insert(carHighlights))

const categoryRows = (content.categories || []).map((category) => ({
  id: category.id,
  slug: category.slug,
  name: category.name,
  description: category.description || null,
  parent_id: category.parentId || null,
  icon: category.icon || null,
  image: category.image || null,
  sort_order: Number(category.sortOrder || 0),
  is_active: category.isActive !== false,
}))
const mainCategoryRows = categoryRows.filter((category) => !category.parent_id)
const subcategoryRows = categoryRows.filter((category) => category.parent_id)
if (mainCategoryRows.length) {
  await assertResult('main categories', await supabase.from('categories').upsert(mainCategoryRows))
}
if (subcategoryRows.length) {
  await assertResult('subcategories', await supabase.from('categories').upsert(subcategoryRows))
}

const productRows = content.products.map((product) => ({
  id: product.id,
  slug: product.id,
  sku: product.sku || `ALI-${product.id}`,
  name: product.name,
  category: product.category || 'other',
  category_id: product.categoryId || null,
  subcategory_id: product.subcategoryId || null,
  brand: product.brand || 'ALI FLEET Genuine',
  price_minor: Math.round(Number(product.price || 0) * 100),
  currency: 'ILS',
  stock_quantity: product.inStock ? 25 : 0,
  max_order_quantity: 10,
  featured: Boolean(product.featured),
  compatibility_summary: product.compatibility || '',
  description: product.description,
  primary_image: product.image,
  published: true,
}))
await assertResult('products', await supabase.from('products').upsert(productRows))

const productIds = productRows.map((product) => product.id)
if (productIds.length) {
  await assertResult('product_media cleanup', await supabase.from('product_media').delete().in('product_id', productIds))
  await assertResult('product_specs cleanup', await supabase.from('product_specs').delete().in('product_id', productIds))
  await assertResult('product_compatibility cleanup', await supabase.from('product_compatibility').delete().in('product_id', productIds))
}
const productMedia = content.products.flatMap((product) => {
  const images = [...new Set([product.image, ...(product.images || [])].filter(Boolean))]
  return images.map((image, index) => ({ product_id: product.id, url: image, alt: product.name, sort_order: index }))
})
const productSpecs = content.products.flatMap((product) =>
  (product.specs || []).map((spec, index) => ({
    product_id: product.id,
    label: spec.label,
    value: spec.value,
    sort_order: index,
  })),
)
const productCompatibility = content.products.flatMap((product) =>
  String(product.compatibility || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((notes) => ({ product_id: product.id, notes })),
)
if (productMedia.length) await assertResult('product_media', await supabase.from('product_media').insert(productMedia))
if (productSpecs.length) await assertResult('product_specs', await supabase.from('product_specs').insert(productSpecs))
if (productCompatibility.length) await assertResult('product_compatibility', await supabase.from('product_compatibility').insert(productCompatibility))

const blogRows = content.blog.map((post) => ({
  id: post.id,
  slug: post.slug || post.id,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content || null,
  author: post.author || 'ALI FLEET',
  author_avatar: post.authorAvatar || null,
  read_time: post.readTime || '5 min',
  cover_image: post.coverImage || post.image,
  tags: post.tags || [],
  category: post.category || 'news',
  featured: Boolean(post.featured),
  published: post.published !== false,
  published_at: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
}))
await assertResult('blog_posts', await supabase.from('blog_posts').upsert(blogRows))

const routes = {
  home: '/',
  cars: '/cars',
  products: '/products',
  blog: '/blog',
  contact: '/contact',
  cart: '/cart',
  trackOrder: '/track-order',
}
const seoRows = []
for (const [entityId, path] of Object.entries(routes)) {
  for (const locale of ['ar', 'en', 'he']) {
    seoRows.push({
      entity_type: 'page',
      entity_id: entityId,
      locale,
      title: content.seo.defaultMetaTitle[locale],
      description: content.seo.defaultMetaDescription[locale],
      canonical_path: path,
      og_title: content.seo.defaultMetaTitle[locale],
      og_description: content.seo.defaultMetaDescription[locale],
      og_image: '/images/hero-showroom.png',
      indexable: !['cart', 'trackOrder'].includes(entityId),
      follow: !['cart', 'trackOrder'].includes(entityId),
    })
  }
}
await assertResult(
  'seo_entries',
  await supabase.from('seo_entries').upsert(seoRows, { onConflict: 'entity_type,entity_id,locale' }),
)

const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listError) throw listError
const demoEmail = 'demo.customer@example.com'
let demoUser = listedUsers.users.find((user) => user.email?.toLowerCase() === demoEmail)
if (!demoUser) {
  const result = await supabase.auth.admin.createUser({
    email: demoEmail,
    password: randomBytes(24).toString('base64url'),
    email_confirm: true,
    user_metadata: { display_name: 'Demo Customer', preferred_locale: 'en' },
  })
  if (result.error) throw result.error
  demoUser = result.data.user
}

await assertResult(
  'demo profile',
  await supabase.from('profiles').update({
    display_name: 'Demo Customer',
    phone: '+972-000-0000',
    tier: 'Regular',
    status: 'active',
  }).eq('id', demoUser.id),
)

const firstProduct = productRows.find((product) => product.stock_quantity > 0)
if (firstProduct) {
  const { data: existingDemoOrder, error: demoOrderLookupError } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', 'AF-DEMO-0001')
    .maybeSingle()
  if (demoOrderLookupError) throw demoOrderLookupError
  if (!existingDemoOrder) {
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      order_number: 'AF-DEMO-0001',
      user_id: demoUser.id,
      customer_name: 'Demo Customer',
      customer_email: demoEmail,
      customer_phone: '+972-000-0000',
      shipping_address: {
        fullName: 'Demo Customer',
        phone: '+972-000-0000',
        street: '100 Example Street',
        city: 'Haifa',
        country: 'Israel',
        postalCode: '00000',
      },
      subtotal_minor: firstProduct.price_minor,
      tax_minor: Math.floor(firstProduct.price_minor * taxRate / 100),
      shipping_minor: firstProduct.price_minor >= freeShipping * 100 ? 0 : 5000,
      total_minor: firstProduct.price_minor + Math.floor(firstProduct.price_minor * taxRate / 100) + (firstProduct.price_minor >= freeShipping * 100 ? 0 : 5000),
      status: 'pending',
      payment_status: 'unpaid',
      payment_method: 'cod',
      customer_notes: 'Safe seeded demo order. No payment was collected.',
      idempotency_key: 'seed-demo-order-0001',
    }).select('id').single()
    if (orderError) throw orderError
    await assertResult('demo order item', await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: firstProduct.id,
      product_name: firstProduct.name,
      sku: firstProduct.sku,
      image: firstProduct.primary_image,
      unit_price_minor: firstProduct.price_minor,
      quantity: 1,
      line_total_minor: firstProduct.price_minor,
    }))
    await assertResult('demo order history', await supabase.from('order_status_history').insert({
      order_id: order.id,
      to_status: 'pending',
      note: 'Seeded demo order; unpaid.',
    }))
  }
}

const { data: existingInquiry, error: inquiryLookupError } = await supabase
  .from('inquiries')
  .select('id')
  .eq('email', demoEmail)
  .eq('message', 'Safe seeded demo inquiry.')
  .maybeSingle()
if (inquiryLookupError) throw inquiryLookupError
if (!existingInquiry) {
  await assertResult('demo inquiry', await supabase.from('inquiries').insert({
    user_id: demoUser.id,
    kind: 'contact',
    name: 'Demo Customer',
    email: demoEmail,
    phone: '+972-000-0000',
    service: 'General inquiry',
    message: 'Safe seeded demo inquiry.',
    status: 'new',
  }))
}

await assertResult(
  'seed_runs',
  await supabase.from('seed_runs').upsert({
    version: '2026-09-11-taxonomy-v2',
    details: {
      source: 'data/site-content.json',
      cars: carRows.length,
      categories: categoryRows.length,
      products: productRows.length,
      blogPosts: blogRows.length,
      safeDemoData: true,
    },
  }),
)

console.log(`Seeded ${carRows.length} cars, ${productRows.length} products, and ${blogRows.length} posts.`)
