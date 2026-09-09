import type { Metadata } from 'next'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductsScreen } from '@/components/products-screen'
import { getCatalogSummaries } from '@/lib/wp/catalog'

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

/**
 * The catalog is read on the server so the products are in the initial HTML —
 * good for SEO and it keeps the WooCommerce endpoint out of the browser. The
 * fetch is cached, so 165 products do not mean 165 round trips per visitor.
 */
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
