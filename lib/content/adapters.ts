import type {
  BlogPostItem,
  CarItem,
  MultiLangString,
  ProductItem,
} from '@/lib/admin/types'
import {
  toSummary,
  type CatalogCategory,
  type Part,
  type PartSummary,
} from '@/lib/data/parts'
import type { ImportCar, CarOrigin } from '@/lib/data/import-cars'
import type { SaleCar, SaleCarCondition } from '@/lib/data/sale-cars'
import {
  blogCategories,
  type BlogCategory,
  type BlogPost,
} from '@/lib/data/blog'
import type { Localized } from '@/lib/i18n/localized'

const fallbackImage = '/images/fleet-truck.png'
const fallbackProductImage = '/images/part-brake-pads.png'
const fallbackAvatar = '/images/hero-avatars.png'

function localized(value?: MultiLangString, fallback = ''): Localized {
  return {
    ar: value?.ar || fallback,
    en: value?.en || value?.ar || fallback,
    he: value?.he || value?.en || value?.ar || fallback,
  }
}

function technical(value?: string): Localized {
  return localized(undefined, value || '')
}

function numericMileage(value: string): number {
  const parsed = Number.parseInt(value.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveOrigin(value?: string): CarOrigin {
  const origins: CarOrigin[] = ['germany', 'uae', 'usa', 'japan', 'korea', 'belgium']
  return origins.includes(value as CarOrigin) ? (value as CarOrigin) : 'germany'
}

function resolveCondition(car: CarItem): SaleCarCondition {
  if (car.condition === 'new' || car.condition === 'demo' || car.condition === 'used') {
    return car.condition
  }
  return numericMileage(car.mileage) === 0 ? 'new' : 'used'
}

function carSpecs(car: CarItem) {
  return {
    engine: car.specs.engine || '',
    transmission: technical(car.transmission),
    fuel: technical(car.fuel),
    drivetrain: car.specs.drivetrain || '',
    color: technical(car.specs.color),
    seats: car.specs.seats || 0,
  }
}

function gallery(car: CarItem) {
  const sources = car.images?.length ? car.images : [car.image]
  return sources.filter(Boolean).map((src) => ({
    src,
    alt: localized(car.title, `${car.make} ${car.model}`.trim()),
  }))
}

export function productToPart(
  product: ProductItem,
  categories: CatalogCategory[] = [],
): Part {
  const name = localized(product.name, product.sku)
  const mainCategory = categories.find(
    (category) =>
      !category.parentId &&
      (category.id === product.categoryId || category.slug === product.category),
  )
  const subcategory = categories.find(
    (category) =>
      category.id === product.subcategoryId &&
      category.parentId === mainCategory?.id,
  )
  const categoryId = mainCategory?.id || product.categoryId || product.category || 'other'
  const compatibility = product.compatibility
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    slug: product.id,
    productId: product.id,
    sku: product.sku,
    category: mainCategory?.slug || product.category || 'other',
    categoryId,
    subcategoryId: subcategory?.id || product.subcategoryId,
    categoryName: localized(mainCategory?.name, product.category || 'Other'),
    subcategoryName: subcategory
      ? localized(subcategory.name, subcategory.slug)
      : undefined,
    brand: product.brand || 'ALI FLEET Genuine',
    price: product.price,
    inStock: product.inStock,
    featured: product.featured,
    image: product.image || fallbackProductImage,
    alt: name,
    name,
    description: localized(product.description),
    specs: (product.specs || []).map((spec) => ({
      label: localized(spec.label),
      value: localized(spec.value),
    })),
    compatibility,
  }
}

export function productToSummary(
  product: ProductItem,
  categories: CatalogCategory[] = [],
): PartSummary {
  return toSummary(productToPart(product, categories))
}

export function carToImport(car: CarItem): ImportCar {
  return {
    slug: car.id,
    model: `${car.make} ${car.model}`.trim() || car.id,
    subtitle: localized(car.title, car.model),
    bodyType: technical(car.specs.bodyType || 'Vehicle'),
    origin: resolveOrigin(car.origin),
    status:
      car.status === 'incoming'
        ? 'inTransit'
        : car.status === 'available' || car.status === 'reserved' || car.status === 'sold'
          ? car.status
          : 'available',
    stage: car.stage || (car.status === 'incoming' ? 2 : 4),
    year: car.year,
    mileage: numericMileage(car.mileage),
    price: car.price || null,
    featured: car.featured,
    image: car.image || fallbackImage,
    alt: localized(car.title, car.model),
    gallery: gallery(car),
    description: localized(car.description),
    highlights: (car.highlights || []).map((item) => localized(item)),
    specs: carSpecs(car),
    eta: localized(car.eta, ''),
  }
}

export function carToSale(car: CarItem): SaleCar {
  return {
    slug: car.id,
    model: `${car.make} ${car.model}`.trim() || car.id,
    subtitle: localized(car.title, car.model),
    bodyType: technical(car.specs.bodyType || 'Vehicle'),
    condition: resolveCondition(car),
    status: car.status === 'incoming' ? 'available' : car.status,
    year: car.year,
    mileage: numericMileage(car.mileage),
    price: car.price || null,
    previousOwners: car.previousOwners ?? null,
    featured: car.featured,
    image: car.image || fallbackImage,
    alt: localized(car.title, car.model),
    gallery: gallery(car),
    description: localized(car.description),
    highlights: (car.highlights || []).map((item) => localized(item)),
    specs: carSpecs(car),
    availability: localized(car.availability, ''),
  }
}

function resolveBlogCategory(value?: string): BlogCategory {
  return blogCategories.includes(value as BlogCategory)
    ? (value as BlogCategory)
    : 'news'
}

export function postToBlogPost(post: BlogPostItem): BlogPost {
  const readingMinutes = Number.parseInt(post.readTime, 10)
  return {
    slug: post.slug || post.id,
    titleEn: post.title.en || post.title.ar,
    titleAr: post.title.ar || post.title.en,
    titleHe: post.title.he || post.title.en || post.title.ar,
    excerptEn: post.excerpt.en || post.excerpt.ar,
    excerptAr: post.excerpt.ar || post.excerpt.en,
    excerptHe: post.excerpt.he || post.excerpt.en || post.excerpt.ar,
    category: resolveBlogCategory(post.category || post.tags?.[0]),
    coverImage: post.coverImage || post.image || fallbackImage,
    authorName: post.author,
    authorAvatar: post.authorAvatar || fallbackAvatar,
    publishedAt: post.date,
    readingMinutes: Number.isFinite(readingMinutes) ? readingMinutes : 5,
    featured: post.featured,
    content: post.content?.en || post.content?.ar || post.content?.he || '',
  }
}
