import 'server-only'

import type { MultiLangString, SiteFullContent } from '@/lib/admin/types'
import type { CopyBlock } from '@/lib/i18n/copy-block'
import type { CarsPageCopy, PageImages } from './types'
import { getSiteContent } from './repository'

export type { CarsPageCopy, PageImages } from './types'

export const FALLBACK_PAGE_IMAGES: PageImages = {
  heroAvatarImage: '/images/hero-avatars.png',
  heroSlide1: '/images/hero-showroom.png',
  heroSlide2: '/images/truck-light.png',
  heroSlide3: '/images/van-light.png',
  heroSlide4: '/images/suv-light.png',
  heroSlide5: '/images/hero-truck.png',
  heroSlide6: '/images/port-light.png',
  fleetVehicle1: '/images/fleet-truck.png',
  fleetVehicle2: '/images/fleet-van.png',
  fleetVehicle3: '/images/fleet-suv.png',
  serviceScene1: '/images/scene-personal-import.png',
  serviceScene2: '/images/scene-direct-import.png',
  serviceScene3: '/images/scene-spare-parts.png',
  importHero: '/images/hero-showroom.png',
  productsHero: '/images/part-brake-pads.png',
  blogHero: '/images/fleet-truck.png',
  contactHero: '/images/hero-truck.png',
}

function copy(value?: MultiLangString): CopyBlock {
  return value || {}
}

export function pageImagesFromContent(content: SiteFullContent): PageImages {
  const hero = content.pages.home.hero
  const slides = hero.slideImages || []
  const fleet = content.pages.home.fleet?.vehicles || []
  const services = content.pages.home.services || []

  return {
    heroAvatarImage: hero.avatarImage || FALLBACK_PAGE_IMAGES.heroAvatarImage,
    heroSlide1: slides[0] || hero.heroImage || FALLBACK_PAGE_IMAGES.heroSlide1,
    heroSlide2: slides[1] || FALLBACK_PAGE_IMAGES.heroSlide2,
    heroSlide3: slides[2] || FALLBACK_PAGE_IMAGES.heroSlide3,
    heroSlide4: slides[3] || FALLBACK_PAGE_IMAGES.heroSlide4,
    heroSlide5: slides[4] || FALLBACK_PAGE_IMAGES.heroSlide5,
    heroSlide6: slides[5] || FALLBACK_PAGE_IMAGES.heroSlide6,
    fleetVehicle1: fleet[0]?.image || FALLBACK_PAGE_IMAGES.fleetVehicle1,
    fleetVehicle2: fleet[1]?.image || FALLBACK_PAGE_IMAGES.fleetVehicle2,
    fleetVehicle3: fleet[2]?.image || FALLBACK_PAGE_IMAGES.fleetVehicle3,
    serviceScene1: services[0]?.image || FALLBACK_PAGE_IMAGES.serviceScene1,
    serviceScene2: services[1]?.image || FALLBACK_PAGE_IMAGES.serviceScene2,
    serviceScene3: services[2]?.image || FALLBACK_PAGE_IMAGES.serviceScene3,
    importHero: content.pages.cars?.bannerImage || FALLBACK_PAGE_IMAGES.importHero,
    productsHero:
      content.pages.products?.bannerImage || FALLBACK_PAGE_IMAGES.productsHero,
    blogHero: content.pages.blog?.bannerImage || FALLBACK_PAGE_IMAGES.blogHero,
    contactHero:
      content.pages.contact?.bannerImage || FALLBACK_PAGE_IMAGES.contactHero,
  }
}

export async function getPageImages(): Promise<PageImages> {
  return pageImagesFromContent(await getSiteContent())
}

export function carsPageCopyFromContent(content: SiteFullContent): CarsPageCopy {
  const page = content.pages.cars
  return {
    hero: {
      eyebrow: copy(page?.eyebrow),
      title: copy(page?.title),
      titleEm: copy(page?.titleEm),
      lead: copy(page?.lead),
      ctaSale: {},
      ctaImport: {},
    },
    saleHeader: {
      eyebrow: copy(page?.saleHeader?.eyebrow),
      title: copy(page?.saleHeader?.title),
      lead: copy(page?.saleHeader?.lead),
    },
    importHeader: {
      eyebrow: copy(page?.importHeader?.eyebrow),
      title: copy(page?.importHeader?.title),
      lead: copy(page?.importHeader?.lead),
    },
  }
}

export async function getCarsPageCopy(): Promise<CarsPageCopy> {
  return carsPageCopyFromContent(await getSiteContent())
}
