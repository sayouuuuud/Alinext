import 'server-only'

import { unstable_cache } from 'next/cache'
import sanitizeHtml from 'sanitize-html'
import type { Locale } from '@/lib/i18n/config'
import { createPublicClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import type { MultilingualPolicy, PolicyPageData, PolicyType } from './types'
import { POLICIES_TAG, PUBLIC_CONTENT_TAG, i18n } from './public-database'

export type { MultilingualPolicy, PolicyPageData, PolicyType } from './types'

const routeByType: Record<PolicyType, string> = { privacy: '/privacy-policy', terms: '/terms', return: '/return-policy' }
const itemIdByType: Record<PolicyType, string> = { privacy: 'privacy', terms: 'terms', return: 'refund' }

function safeContent(value: string): string {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value)
  const source = looksLikeHtml ? value : value.split(/\n{2,}/).map((paragraph) => `<p>${paragraph}</p>`).join('')
  return sanitizeHtml(source, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (_tagName, attribs) => ({ tagName: 'a', attribs: { ...attribs, ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) } }),
    },
  })
}

type PolicyRow = {
  id: string
  slug: string
  title: Json
  content: Json
  last_updated: string
}

const cachedPolicies = unstable_cache(
  async (): Promise<PolicyRow[]> => {
    const { data, error } = await createPublicClient()
      .from('policy_pages')
      .select('id,slug,title,content,last_updated')
      .eq('published', true)
    if (error) throw new Error(`Public policies unavailable: ${error.message}`)
    return (data || []) as unknown as PolicyRow[]
  },
  ['alifleet-public-policies-v2'],
  { tags: [PUBLIC_CONTENT_TAG, POLICIES_TAG], revalidate: 3600 },
)

function toPage(row: PolicyRow, type: PolicyType, locale: Locale, databaseId: number): PolicyPageData {
  const title = i18n(row.title)
  const content = i18n(row.content)
  const route = routeByType[type]
  return {
    databaseId,
    title: title[locale] || title.en || title.ar,
    slug: row.slug || route.slice(1),
    uri: `${route}/`,
    modified: row.last_updated,
    content: safeContent(content[locale] || content.en || content.ar),
  }
}

async function getPolicy(type: PolicyType): Promise<MultilingualPolicy> {
  const row = (await cachedPolicies()).find((item) => item.id === itemIdByType[type])
  if (!row) return { ar: null, en: null, he: null }
  return {
    ar: toPage(row, type, 'ar', 1),
    en: toPage(row, type, 'en', 2),
    he: toPage(row, type, 'he', 3),
  }
}

export async function getPolicyByLocale(policyType: PolicyType, locale: Locale): Promise<PolicyPageData | null> {
  return (await getPolicy(policyType))[locale]
}
export async function getPrivacyPolicy(): Promise<MultilingualPolicy> { return getPolicy('privacy') }
export async function getTermsPolicy(): Promise<MultilingualPolicy> { return getPolicy('terms') }
export async function getReturnPolicy(): Promise<MultilingualPolicy> { return getPolicy('return') }
export async function getRefundReturnsPage(): Promise<PolicyPageData | null> { return (await getPolicy('return')).en }
