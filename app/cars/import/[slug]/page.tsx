import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getVehicle, getSimilarVehicles } from '@/lib/content/vehicles'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ImportCarDetail } from '@/components/import-car-detail'
import { ImportCustomCta } from '@/components/import-custom-cta'
import { getPublicMetadata } from '@/lib/content/metadata'
import { getRequestLocale } from '@/lib/i18n/request-locale'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const car = await getVehicle(slug)
  if (!car) return { title: 'Vehicle not found | ALI FLEET' }

  const locale = await getRequestLocale()
  return getPublicMetadata({
    entityType: 'car',
    entityId: slug,
    locale,
    fallback: {
      title: `${car.model} · ${car.year} | ALI FLEET`,
      description: car.description[locale] || car.subtitle[locale] || car.description.en,
      path: `/cars/import/${slug}`,
      image: car.image,
    },
  })
}

export default async function ImportCarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const car = await getVehicle(slug)
  if (!car) notFound()

  const related = await getSimilarVehicles(car)

  return (
    <>
      <SiteHeader />
      <main>
        <ImportCarDetail car={car} related={related} />
        <ImportCustomCta />
      </main>
      <SiteFooter />
    </>
  )
}
