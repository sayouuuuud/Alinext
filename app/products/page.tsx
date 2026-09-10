import type { Metadata } from 'next'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductsScreen } from '@/components/products-screen'
import { getCatalogSummaries } from '@/lib/content/catalog'
import { getPublicMetadata } from '@/lib/content/metadata'
import { getRequestLocale } from '@/lib/i18n/request-locale'

export async function generateMetadata(): Promise<Metadata> {
  return getPublicMetadata({
    entityType: 'page',
    entityId: 'products',
    locale: await getRequestLocale(),
    fallback: {
      title: 'Spare Parts — Genuine Truck & Commercial Vehicle Parts',
      description: 'Genuine and OEM spare parts for commercial vehicles, dispatched from Israel.',
      path: '/products',
      image: '/images/spare-parts.png',
    },
  })
}

/** The local catalog renders on the server for complete initial HTML and SEO. */
export default async function ProductsPage() {
  const { parts, status, hasUntranslated } = await getCatalogSummaries()

  return (
    <>
      <SiteHeader />
      <main>
        <ProductsScreen
          parts={parts}
          status={status}
          hasUntranslated={hasUntranslated}
        />
      </main>
      <SiteFooter />
    </>
  )
}
