import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PolicyScreen } from '@/components/policy-screen'
import { getPrivacyPolicy, getPolicyByLocale } from '@/lib/content/policies'
import { isLocale } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { getPublicMetadata } from '@/lib/content/metadata'

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const policy = await getPolicyByLocale('privacy', locale)
  return getPublicMetadata({
    entityType: 'policy',
    entityId: 'privacy',
    locale,
    fallback: {
      title: policy?.title || 'Privacy Policy | ALI FLEET',
      description: 'Official privacy and data protection terms for ALI FLEET customers and visitors.',
      path: '/privacy-policy',
    },
  })
}

type PageProps = {
  searchParams?: Promise<{ locale?: string }>
}

export default async function PrivacyPolicyPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const rawLocale = resolvedParams?.locale
  const requestedLocale = typeof rawLocale === 'string' ? rawLocale.trim().toLowerCase() : undefined
  const activeLocale = isLocale(requestedLocale) ? requestedLocale : undefined

  const policy = await getPrivacyPolicy()

  return (
    <>
      <SiteHeader />
      <main>
        <PolicyScreen
          policyType="privacy"
          policy={policy}
          initialLocale={activeLocale}
        />
      </main>
      <SiteFooter />
    </>
  )
}
