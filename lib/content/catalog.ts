import 'server-only'

import type { Part, PartSummary } from '@/lib/data/parts'
import { productToPart, productToSummary } from './adapters'
import { getSiteContent } from './repository'

export type CatalogStatus = 'ok' | 'empty'

export type Catalog = {
  parts: Part[]
  status: CatalogStatus
  hasUntranslated: boolean
}

export async function getCatalog(): Promise<Catalog> {
  const parts = getSiteContent().products.map(productToPart)
  return {
    parts,
    status: parts.length ? 'ok' : 'empty',
    hasUntranslated: false,
  }
}

export async function getCatalogSummaries(): Promise<{
  parts: PartSummary[]
  status: CatalogStatus
  hasUntranslated: boolean
}> {
  const parts = getSiteContent().products.map(productToSummary)
  return {
    parts,
    status: parts.length ? 'ok' : 'empty',
    hasUntranslated: false,
  }
}

export async function getPart(slug: string): Promise<Part | null> {
  const product = getSiteContent().products.find((item) => item.id === slug)
  return product ? productToPart(product) : null
}

export async function getRelatedParts(part: Part, limit = 4): Promise<PartSummary[]> {
  const products = getSiteContent().products.map(productToPart)
  const others = products.filter((item) => item.slug !== part.slug)
  return [
    ...others.filter((item) => item.category === part.category),
    ...others.filter((item) => item.category !== part.category),
  ]
    .slice(0, limit)
    .map((item) => ({
      slug: item.slug,
      productId: item.productId,
      sku: item.sku,
      category: item.category,
      brand: item.brand,
      price: item.price,
      inStock: item.inStock,
      featured: item.featured,
      image: item.image,
      alt: item.alt,
      name: item.name,
    }))
}
