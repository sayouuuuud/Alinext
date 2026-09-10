import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PolicyScreen } from '@/components/policy-screen'
import { getTermsPolicy, getPolicyByLocale } from '@/lib/content/policies'
import { isLocale } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { getPublicMetadata } from '@/lib/content/metadata'

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const policy = await getPolicyByLocale('terms', locale)
  return getPublicMetadata({
    entityType: 'policy',
    entityId: 'terms',
    locale,
    fallback: {
      title: policy?.title || 'Terms & Conditions | ALI FLEET',
      description: 'Official service terms for ALI FLEET customers, purchases, and vehicle imports.',
      path: '/terms',
    },
  })
}

type PageProps = {
  searchParams?: Promise<{ locale?: string }>
}

export default async function TermsPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const rawLocale = resolvedParams?.locale
  const requestedLocale = typeof rawLocale === 'string' ? rawLocale.trim().toLowerCase() : undefined
  const activeLocale = isLocale(requestedLocale) ? requestedLocale : undefined

  const policy = await getTermsPolicy()

  return (
    <>
      <SiteHeader />
      <main>
        <PolicyScreen
          policyType="terms"
          policy={policy}
          initialLocale={activeLocale}
        />
      </main>
      <SiteFooter />
    </>
  )
}
