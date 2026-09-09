import type { Metadata } from 'next'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductsScreen } from '@/components/products-screen'
import { getCatalogSummaries } from '@/lib/content/catalog'

export const metadata: Metadata = {
  title: 'Spare Parts — Genuine Truck & Commercial Vehicle Parts',
  description:
    'Genuine and OEM spare parts for DAF, MAN, Volvo, Mercedes, Scania and Iveco trucks — headlights, mirrors, bumpers, steps and body panels, dispatched from Israel.',
  alternates: { canonical: '/products' },
  openGraph: {
    type: 'website',
    title: 'Spare Parts — ALI FLEET',
    description:
      'Genuine and OEM spare parts for DAF, MAN, Volvo, Mercedes, Scania and Iveco trucks.',
    url: '/products',
  },
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
