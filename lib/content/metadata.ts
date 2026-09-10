import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/server'
import { defaultLocale, locales, type Locale } from '@/lib/i18n/config'
import { isIndexedPathname, toPublicPathname } from '@/lib/i18n/routing'
import { SEO_TAG } from './seo-tags'

export type SeoEntityType = 'page' | 'car' | 'product' | 'blog' | 'policy'

type SeoRow = {
  title: string
  description: string
  keywords: string[]
  canonical_path: string | null
  og_title: string | null
  og_description: string | null
  og_image: string | null
  indexable: boolean
  follow: boolean
}

export type SeoMetadataFallback = {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
}

const cachedSeoEntry = unstable_cache(
  async (entityType: SeoEntityType, entityId: string, locale: Locale): Promise<SeoRow | null> => {
    const { data, error } = await createPublicClient()
      .from('seo_entries')
      .select('title,description,keywords,canonical_path,og_title,og_description,og_image,indexable,follow')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('locale', locale)
      .maybeSingle()
    if (error) throw new Error(`SEO metadata unavailable: ${error.message}`)
    return data as unknown as SeoRow | null
  },
  ['alifleet-public-seo-v1'],
  { tags: [SEO_TAG], revalidate: 300 },
)

export async function getPublicMetadata({
  entityType,
  entityId,
  locale,
  fallback,
}: {
  entityType: SeoEntityType
  entityId: string
  locale: Locale
  fallback: SeoMetadataFallback
}): Promise<Metadata> {
  const entry = await cachedSeoEntry(entityType, entityId, locale)
  const canonicalPath = entry?.canonical_path || fallback.path
  const canonical = isIndexedPathname(canonicalPath)
    ? toPublicPathname(canonicalPath, locale)
    : canonicalPath
  const languageAlternates = isIndexedPathname(canonicalPath)
    ? Object.fromEntries([
        ...locales.map((item) => [item, toPublicPathname(canonicalPath, item)]),
        ['x-default', toPublicPathname(canonicalPath, defaultLocale)],
      ])
    : undefined
  const title = entry?.title || fallback.title
  const description = entry?.description || fallback.description
  const image = entry?.og_image || fallback.image
  const sharedOpenGraph = {
    title: entry?.og_title || title,
    description: entry?.og_description || description,
    url: canonical,
    images: image ? [{ url: image }] : undefined,
  }

  return {
    title: { absolute: title },
    description,
    keywords: entry?.keywords?.length ? entry.keywords : undefined,
    alternates: { canonical, languages: languageAlternates },
    robots: {
      index: entry?.indexable ?? true,
      follow: entry?.follow ?? true,
    },
    openGraph: fallback.type === 'article'
      ? { ...sharedOpenGraph, type: 'article', publishedTime: fallback.publishedTime }
      : { ...sharedOpenGraph, type: 'website' },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: entry?.og_title || title,
      description: entry?.og_description || description,
      images: image ? [image] : undefined,
    },
  }
}
