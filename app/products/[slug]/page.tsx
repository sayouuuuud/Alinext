import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail } from '@/components/product-detail'
import { absoluteUrl } from '@/lib/seo'
import { serializeJsonLd } from '@/lib/json-ld'
import { getPart, getRelatedParts } from '@/lib/content/catalog'
import { getPublicMetadata } from '@/lib/content/metadata'
import { getRequestLocale } from '@/lib/i18n/request-locale'

/** Product detail pages resolve directly from the local content catalog. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const part = await getPart(slug)
  if (!part) return { title: 'ALI FLEET' }

  const locale = await getRequestLocale()
  const title = part.name[locale] || part.name.en || part.name.he
  const description = part.description[locale] || part.description.en || part.description.he

  return getPublicMetadata({
    entityType: 'product',
    entityId: slug,
    locale,
    fallback: {
      title: `${title} — ALI FLEET Spare Parts`,
      description,
      path: `/products/${slug}`,
      image: part.image,
    },
  })
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const part = await getPart(slug)
  if (!part) notFound()

  const related = await getRelatedParts(part)

  // Product structured data. This is what lets Google show the price and
  // availability directly in the result row instead of a plain blue link.
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: part.name.en || part.name.he,
    description: part.description.en || part.description.he || undefined,
    sku: part.sku || undefined,
    brand: part.brand ? { '@type': 'Brand', name: part.brand } : undefined,
    image: part.image ? [part.image] : undefined,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${slug}`),
      priceCurrency: 'ILS',
      price: part.price,
      availability: part.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'ALI FLEET' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // CMS values are escaped so they cannot terminate the JSON-LD script.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }}
      />
      <SiteHeader />
      <main>
        <ProductDetail part={part} related={related} />
      </main>
      <SiteFooter />
    </>
  )
}
