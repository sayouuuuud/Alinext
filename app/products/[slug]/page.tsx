import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail } from '@/components/product-detail'
import { absoluteUrl } from '@/lib/seo'
import { serializeJsonLd } from '@/lib/json-ld'
import { getPart, getRelatedParts } from '@/lib/wp/catalog'

/**
 * Product pages are rendered on demand rather than pre-generated: the catalog
 * lives in WooCommerce, so a new product must appear without a redeploy. There
 * is no `generateStaticParams` for that reason — the cached catalog fetch is
 * what keeps this cheap.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const part = await getPart(slug)
  if (!part) return { title: 'ALI FLEET' }

  // English falls back to the Hebrew original for products that are not
  // translated yet, which is still far better metadata than a bare site name.
  const title = part.name.en || part.name.he
  const description = part.description.en || part.description.he || undefined

  return {
    title: `${title} — ALI FLEET Spare Parts`,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: 'website',
      title: `${title} — ALI FLEET Spare Parts`,
      description,
      url: absoluteUrl(`/products/${slug}`),
      images: part.image ? [{ url: part.image, alt: title }] : undefined,
    },
  }
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
