import 'server-only'

import sanitizeHtml from 'sanitize-html'
import type { Locale } from '@/lib/i18n/config'
import type { PolicyItem } from '@/lib/admin/types'
import type {
  MultilingualPolicy,
  PolicyPageData,
  PolicyType,
} from './types'
import { getSiteContent } from './repository'

export type {
  MultilingualPolicy,
  PolicyPageData,
  PolicyType,
} from './types'

const routeByType: Record<PolicyType, string> = {
  privacy: '/privacy-policy',
  terms: '/terms',
  return: '/return-policy',
}

const itemIdByType: Record<PolicyType, PolicyItem['id']> = {
  privacy: 'privacy',
  terms: 'terms',
  return: 'refund',
}

function safeContent(value: string): string {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value)
  const source = looksLikeHtml
    ? value
    : value
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join('')

  return sanitizeHtml(source, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
      }),
    },
  })
}

function toPage(
  item: PolicyItem,
  type: PolicyType,
  locale: Locale,
  databaseId: number
): PolicyPageData {
  const route = routeByType[type]
  return {
    databaseId,
    title: item.title[locale] || item.title.en || item.title.ar,
    slug: route.slice(1),
    uri: `${route}/`,
    modified: item.lastUpdated,
    content: safeContent(item.content[locale] || item.content.en || item.content.ar),
  }
}

function getPolicy(type: PolicyType): MultilingualPolicy {
  const item = getSiteContent().pages.policies.find(
    (policy) => policy.id === itemIdByType[type]
  )
  if (!item) return { ar: null, en: null, he: null }
  return {
    ar: toPage(item, type, 'ar', 1),
    en: toPage(item, type, 'en', 2),
    he: toPage(item, type, 'he', 3),
  }
}

export async function getPolicyByLocale(
  policyType: PolicyType,
  locale: Locale
): Promise<PolicyPageData | null> {
  return getPolicy(policyType)[locale]
}

export async function getPrivacyPolicy(): Promise<MultilingualPolicy> {
  return getPolicy('privacy')
}

export async function getTermsPolicy(): Promise<MultilingualPolicy> {
  return getPolicy('terms')
}

export async function getReturnPolicy(): Promise<MultilingualPolicy> {
  return getPolicy('return')
}

export async function getRefundReturnsPage(): Promise<PolicyPageData | null> {
  return getPolicy('return').en
}
