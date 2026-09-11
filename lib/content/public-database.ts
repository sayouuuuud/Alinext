import 'server-only'

import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import type { CatalogCategory } from '@/lib/data/parts'
import type {
  BlogPostItem,
  CarItem,
  MultiLangString,
  ProductItem,
  SiteFullContent,
} from '@/lib/admin/types'

export const PUBLIC_CONTENT_TAG = 'site-content'
export const SETTINGS_TAG = 'settings'
export const PAGES_TAG = 'pages'
export const PRODUCTS_TAG = 'products'
export const CATEGORIES_TAG = 'categories'
export const CARS_TAG = 'cars'
export const BLOG_TAG = 'blog'
export const POLICIES_TAG = 'policies'

function record(value: Json | undefined | null): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function i18n(value: Json | undefined | null, fallback = ''): MultiLangString {
  const item = record(value)
  return {
    ar: typeof item.ar === 'string' ? item.ar : fallback,
    en: typeof item.en === 'string' ? item.en : fallback,
    he: typeof item.he === 'string' ? item.he : fallback,
  }
}

type PublicSettingRow = { key: string; value: Json; updated_at: string }
type PageSectionRow = { page_key: string; section_key: string; content: Json; updated_at: string }
type MediaRow = { car_id?: string; product_id?: string; url: string; sort_order: number }
type HighlightRow = { car_id: string; content: Json; sort_order: number }
type SpecRow = { product_id: string; label: Json; value: Json; sort_order: number }
type CompatibilityRow = { product_id: string; notes: string | null; make: string | null; model: string | null }

const cachedPublicSiteContent = unstable_cache(
  async (): Promise<SiteFullContent> => {
    const supabase = createPublicClient()
    const [settingsResult, sectionsResult] = await Promise.all([
      supabase.from('site_settings_public').select('key,value,updated_at'),
      supabase
        .from('page_sections')
        .select('page_key,section_key,content,updated_at')
        .eq('published', true)
        .order('sort_order', { ascending: true }),
    ])
    if (settingsResult.error) throw new Error(`Public settings unavailable: ${settingsResult.error.message}`)
    if (sectionsResult.error) throw new Error(`Public page sections unavailable: ${sectionsResult.error.message}`)

    const settingsRows = (settingsResult.data || []) as unknown as PublicSettingRow[]
    const sectionRows = (sectionsResult.data || []) as unknown as PageSectionRow[]
    const settings = new Map(settingsRows.map((row) => [row.key, row.value]))
    const pages: Record<string, Record<string, Json>> = {}
    for (const section of sectionRows) {
      pages[section.page_key] ||= {}
      pages[section.page_key][section.section_key] = section.content
    }

    const home = pages.home as unknown as SiteFullContent['pages']['home']
    if (!home?.hero || !Array.isArray(home.stats) || !Array.isArray(home.services)) {
      throw new Error('Published home page sections are incomplete')
    }

    const commerce = record(settings.get('commerce'))
    const updatedAt = [...settingsRows, ...sectionRows]
      .map((row) => row.updated_at)
      .sort()
      .at(-1) || new Date(0).toISOString()

    return {
      version: 6,
      lastSaved: updatedAt,
      security: { username: '', email: '', twoFactorEnabled: false, sessionTimeoutMinutes: 0 },
      notifications: {},
      branding: settings.get('branding') as unknown as SiteFullContent['branding'],
      seo: settings.get('seo') as unknown as SiteFullContent['seo'],
      maintenance: settings.get('maintenance') as unknown as SiteFullContent['maintenance'],
      commerce: {
        currency: typeof commerce.currency_symbol === 'string' ? commerce.currency_symbol : '₪',
        currencySymbol: typeof commerce.currency_symbol === 'string' ? commerce.currency_symbol : '₪',
        taxRatePercent: typeof commerce.tax_rate_percent === 'number' ? commerce.tax_rate_percent : 17,
        freeShippingThreshold: typeof commerce.free_shipping_threshold_minor === 'number' ? commerce.free_shipping_threshold_minor / 100 : 500,
        enableCod: commerce.cod_enabled === true,
        enableCashOnDelivery: commerce.cod_enabled === true,
        enableBankTransfer: commerce.bank_transfer_enabled === true,
        enableBankWire: commerce.bank_transfer_enabled === true,
        enableCardPayment: false,
        enableCardPayments: false,
        enablePaypal: false,
      },
      general: {
        contact: settings.get('contact') as unknown as SiteFullContent['general']['contact'],
        social: settings.get('social') as unknown as SiteFullContent['general']['social'],
        navigation: settings.get('navigation') as unknown as SiteFullContent['general']['navigation'],
        footer: settings.get('footer') as unknown as SiteFullContent['general']['footer'],
        currency: typeof commerce.currency_symbol === 'string' ? commerce.currency_symbol : '₪',
      },
      pages: {
        home,
        cars: pages.cars as unknown as SiteFullContent['pages']['cars'],
        products: pages.products as unknown as SiteFullContent['pages']['products'],
        blog: pages.blog as unknown as SiteFullContent['pages']['blog'],
        contact: pages.contact as unknown as SiteFullContent['pages']['contact'],
        trackOrder: pages.trackOrder as unknown as SiteFullContent['pages']['trackOrder'],
        cart: pages.cart as unknown as SiteFullContent['pages']['cart'],
        policies: [],
      },
      cars: [],
      products: [],
      blog: [],
      orders: [],
      inquiries: [],
      customers: [],
    }
  },
  ['alifleet-public-shell-v2'],
  { tags: [PUBLIC_CONTENT_TAG, SETTINGS_TAG, PAGES_TAG], revalidate: 300 },
)

const cachedProducts = unstable_cache(
  async (): Promise<ProductItem[]> => {
    const supabase = createPublicClient()
    const [productsResult, mediaResult, specsResult, compatibilityResult] = await Promise.all([
      supabase.from('products').select('*').eq('published', true).is('archived_at', null).order('featured', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('product_media').select('product_id,url,sort_order').order('sort_order'),
      supabase.from('product_specs').select('product_id,label,value,sort_order').order('sort_order'),
      supabase.from('product_compatibility').select('product_id,make,model,notes'),
    ])
    const firstError = [productsResult, mediaResult, specsResult, compatibilityResult].find((result) => result.error)?.error
    if (firstError) throw new Error(`Public products unavailable: ${firstError.message}`)

    const media = (mediaResult.data || []) as unknown as MediaRow[]
    const specs = (specsResult.data || []) as unknown as SpecRow[]
    const compatibility = (compatibilityResult.data || []) as unknown as CompatibilityRow[]
    return (productsResult.data || []).map((product) => {
      const images = media.filter((item) => item.product_id === product.id).map((item) => item.url)
      const compatibilityItems = compatibility
        .filter((item) => item.product_id === product.id)
        .map((item) => item.notes || [item.make, item.model].filter(Boolean).join(' '))
        .filter(Boolean)
      return {
        id: product.slug,
        name: i18n(product.name, product.sku),
        sku: product.sku,
        category: product.category,
        categoryId: product.category_id || undefined,
        subcategoryId: product.subcategory_id || undefined,
        brand: product.brand || undefined,
        price: product.price_minor / 100,
        inStock: product.stock_quantity > 0,
        featured: product.featured,
        compatibility: compatibilityItems.join(', ') || product.compatibility_summary || '',
        image: product.primary_image || images[0] || '/images/part-brake-pads.png',
        images,
        specs: specs
          .filter((item) => item.product_id === product.id)
          .map((item) => ({ label: i18n(item.label), value: i18n(item.value) })),
        description: i18n(product.description),
      }
    })
  },
  ['alifleet-public-products-v3'],
  { tags: [PUBLIC_CONTENT_TAG, PRODUCTS_TAG], revalidate: 300 },
)

const cachedCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id,slug,name,parent_id,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error) throw new Error(`Public categories unavailable: ${error.message}`)

    return (data || []).map((category) => ({
      id: category.id,
      slug: category.slug,
      name: i18n(category.name, category.slug),
      parentId: category.parent_id,
      sortOrder: category.sort_order,
    }))
  },
  ['alifleet-public-categories-v1'],
  { tags: [PUBLIC_CONTENT_TAG, CATEGORIES_TAG], revalidate: 300 },
)

const cachedCars = unstable_cache(
  async (): Promise<CarItem[]> => {
    const supabase = createPublicClient()
    const [carsResult, mediaResult, highlightsResult] = await Promise.all([
      supabase.from('cars').select('*').eq('published', true).is('archived_at', null).order('featured', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('car_media').select('car_id,url,sort_order').order('sort_order'),
      supabase.from('car_highlights').select('car_id,content,sort_order').order('sort_order'),
    ])
    const firstError = [carsResult, mediaResult, highlightsResult].find((result) => result.error)?.error
    if (firstError) throw new Error(`Public cars unavailable: ${firstError.message}`)

    const media = (mediaResult.data || []) as unknown as MediaRow[]
    const highlights = (highlightsResult.data || []) as unknown as HighlightRow[]
    return (carsResult.data || []).map((car) => {
      const images = media.filter((item) => item.car_id === car.id).map((item) => item.url)
      return {
        id: car.slug,
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
        status: car.status as CarItem['status'],
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
  },
  ['alifleet-public-cars-v2'],
  { tags: [PUBLIC_CONTENT_TAG, CARS_TAG], revalidate: 300 },
)

const cachedPosts = unstable_cache(
  async (): Promise<BlogPostItem[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
    if (error) throw new Error(`Public blog unavailable: ${error.message}`)
    return (data || []).map((post) => ({
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
  },
  ['alifleet-public-blog-v2'],
  { tags: [PUBLIC_CONTENT_TAG, BLOG_TAG], revalidate: 300 },
)

export async function getPublicSiteContent() {
  return cachedPublicSiteContent()
}

export async function getPublicProducts() {
  return cachedProducts()
}

export async function getPublicCategories() {
  return cachedCategories()
}

export async function getPublicCars() {
  return cachedCars()
}

export async function getPublicPosts() {
  return cachedPosts()
}

export { i18n }
