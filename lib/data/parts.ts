import type { Localized, LocalizedOrPlain } from '@/lib/i18n/localized'

/**
 * Shapes for the spare-parts catalog.
 *
 * Products and their taxonomy are managed by the ALI FLEET content system.
 * Stable ids are shared by the listing, detail pages, cart, and admin panel.
 */

export type PartCategory = string

export type CatalogCategory = {
  id: string
  slug: string
  name: Localized
  parentId: string | null
  sortOrder: number
}

/**
 * The fields every product tile, search filter and cart line needs. Kept
 * separate from `Part` so listings do not ship long descriptions and specs.
 */
export type PartSummary = {
  slug: string
  productId: string
  sku: string
  category: PartCategory
  categoryId: string
  subcategoryId?: string
  categoryName: Localized
  subcategoryName?: Localized
  brand: string
  price: number
  inStock: boolean
  featured?: boolean
  image: string
  alt: Localized
  name: Localized
  /** Marks products that only have their original Hebrew text. */
  untranslated?: boolean
}

export type Part = PartSummary & {
  description: Localized
  specs: { label: Localized; value: LocalizedOrPlain }[]
  compatibility: string[]
}

export function toSummary(part: Part): PartSummary {
  return {
    slug: part.slug,
    productId: part.productId,
    sku: part.sku,
    category: part.category,
    categoryId: part.categoryId,
    subcategoryId: part.subcategoryId,
    categoryName: part.categoryName,
    subcategoryName: part.subcategoryName,
    brand: part.brand,
    price: part.price,
    inStock: part.inStock,
    featured: part.featured,
    image: part.image,
    alt: part.alt,
    name: part.name,
    untranslated: part.untranslated,
  }
}
