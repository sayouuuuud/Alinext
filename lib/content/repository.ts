import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { getPublicSiteContent, PUBLIC_CONTENT_TAG } from './public-database'
import type { Json } from '@/lib/supabase/database.types'
import type {
  BlogPostItem,
  CarItem,
  CategoryItem,
  InquiryItem,
  MultiLangString,
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
  const [baseContent, privateSettingsResult, carsResult, carMediaResult, highlightsResult, productsResult, productMediaResult, specsResult, compatibilityResult, postsResult, categoriesResult] = await Promise.all([
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
    admin.from('categories').select('*').order('sort_order', { ascending: true }),
  ])

  const firstError = [privateSettingsResult, carsResult, carMediaResult, highlightsResult, productsResult, productMediaResult, specsResult, compatibilityResult, postsResult, categoriesResult].find((result) => result.error)?.error
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
        categoryId: product.category_id || undefined,
        subcategoryId: product.subcategory_id || undefined,
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

  const categories: CategoryItem[] = (categoriesResult.data || []).map((cat) => ({
    id: cat.id,
    slug: cat.slug || cat.id,
    name: i18n(cat.name),
    description: cat.description ? i18n(cat.description) : undefined,
    parentId: cat.parent_id || null,
    icon: cat.icon || undefined,
    image: cat.image || undefined,
    sortOrder: typeof cat.sort_order === 'number' ? cat.sort_order : 0,
    isActive: cat.is_active !== false,
  }))

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
    categories,
    blog,
  }
}

export async function getSiteContent(): Promise<SiteFullContent> {
  return getPublicSiteContent()
}

export type AdminSiteContent = Omit<SiteFullContent, 'orders' | 'customers'>

export async function getAdminSiteContent(): Promise<AdminSiteContent> {
  const content = await loadBaseAndCatalog(true)
  const admin = createAdminClient()
  const inquiriesResult = await admin
    .from('inquiries')
    .select('id,name,email,phone,service,kind,message,created_at,status')
    .order('created_at', { ascending: false })
  if (inquiriesResult.error) throw new Error('Supabase admin content query failed')

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

  const safeContent = Object.fromEntries(
    Object.entries(content).filter(([key]) => key !== 'orders' && key !== 'customers'),
  ) as AdminSiteContent
  return { ...safeContent, inquiries }
}
