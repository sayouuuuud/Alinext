import 'server-only'

import type { CatalogCategory, Part, PartSummary } from '@/lib/data/parts'
import { toSummary } from '@/lib/data/parts'
import { productToPart, productToSummary } from './adapters'
import { getPublicCategories, getPublicProducts } from './public-database'

export type CatalogStatus = 'ok' | 'empty'
export type Catalog = {
  parts: Part[]
  categories: CatalogCategory[]
  status: CatalogStatus
  hasUntranslated: boolean
}

export async function getCatalog(): Promise<Catalog> {
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ])
  const parts = products.map((product) => productToPart(product, categories))
  return {
    parts,
    categories,
    status: parts.length ? 'ok' : 'empty',
    hasUntranslated: false,
  }
}

export async function getCatalogSummaries(): Promise<{
  parts: PartSummary[]
  categories: CatalogCategory[]
  status: CatalogStatus
  hasUntranslated: boolean
}> {
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ])
  const parts = products.map((product) => productToSummary(product, categories))
  return {
    parts,
    categories,
    status: parts.length ? 'ok' : 'empty',
    hasUntranslated: false,
  }
}

export async function getPart(slug: string): Promise<Part | null> {
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ])
  const product = products.find((item) => item.id === slug)
  return product ? productToPart(product, categories) : null
}

export async function getRelatedParts(part: Part, limit = 4): Promise<PartSummary[]> {
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ])
  const others = products
    .map((product) => productToPart(product, categories))
    .filter((item) => item.slug !== part.slug)

  return others
    .sort((a, b) => {
      const score = (item: Part) => {
        if (part.subcategoryId && item.subcategoryId === part.subcategoryId) return 2
        if (item.categoryId === part.categoryId) return 1
        return 0
      }
      return score(b) - score(a)
    })
    .slice(0, limit)
    .map(toSummary)
}
