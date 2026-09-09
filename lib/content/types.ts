import type { CopyBlock } from '@/lib/i18n/copy-block'

export type PageImages = {
  heroAvatarImage: string
  heroSlide1: string
  heroSlide2: string
  heroSlide3: string
  heroSlide4: string
  heroSlide5: string
  heroSlide6: string
  fleetVehicle1: string
  fleetVehicle2: string
  fleetVehicle3: string
  serviceScene1: string
  serviceScene2: string
  serviceScene3: string
  importHero: string
  productsHero: string
  blogHero: string
  contactHero: string
}

export type CarsPageCopy = {
  hero: {
    eyebrow: CopyBlock
    title: CopyBlock
    titleEm: CopyBlock
    lead: CopyBlock
    ctaSale: CopyBlock
    ctaImport: CopyBlock
  }
  saleHeader: {
    eyebrow: CopyBlock
    title: CopyBlock
    lead: CopyBlock
  }
  importHeader: {
    eyebrow: CopyBlock
    title: CopyBlock
    lead: CopyBlock
  }
}

export type PolicyType = 'privacy' | 'terms' | 'return'

export type PolicyPageData = {
  databaseId: number
  title: string
  slug: string
  uri: string
  content: string
  date?: string | null
  modified?: string | null
}

export type MultilingualPolicy = {
  ar: PolicyPageData | null
  en: PolicyPageData | null
  he: PolicyPageData | null
}
