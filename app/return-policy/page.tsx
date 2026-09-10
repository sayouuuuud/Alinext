import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PolicyScreen } from '@/components/policy-screen'
import { getReturnPolicy, getPolicyByLocale } from '@/lib/content/policies'
import { isLocale } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { getPublicMetadata } from '@/lib/content/metadata'

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const policy = await getPolicyByLocale('return', locale)
  return getPublicMetadata({
    entityType: 'policy',
    entityId: 'refund',
    locale,
    fallback: {
      title: policy?.title || 'Refund & Returns Policy | ALI FLEET',
      description: 'Official refund, return, and exchange policy for ALI FLEET purchases.',
      path: '/return-policy',
    },
  })
}

type PageProps = {
  searchParams?: Promise<{ locale?: string }>
}

export default async function ReturnPolicyPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const rawLocale = resolvedParams?.locale
  const requestedLocale = typeof rawLocale === 'string' ? rawLocale.trim().toLowerCase() : undefined
  const activeLocale = isLocale(requestedLocale) ? requestedLocale : undefined

  const policy = await getReturnPolicy()

  return (
    <>
      <SiteHeader />
      <main>
        <PolicyScreen
          policyType="return"
          policy={policy}
          initialLocale={activeLocale}
        />
      </main>
      <SiteFooter />
    </>
  )
}
