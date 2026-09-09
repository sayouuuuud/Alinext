'use client'

import LocaleLink from '@/components/locale-link'
import { ArrowUpRight, Ship, Store } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useSiteContent } from '@/lib/admin/site-content-context'
import { resolveCopy } from '@/lib/i18n/copy-block'
import type { CarsPageCopy } from '@/lib/content/types'
import { PageHero } from '@/components/page-hero'

type Props = {
  /** Server snapshot; live admin edits override it through the content context. */
  copy?: CarsPageCopy['hero']
}

export function CarsHero({ copy }: Props) {
  const { t, locale } = useLanguage()
  const { content, tStr } = useSiteContent()
  const carsPage = content?.pages?.cars

  const eyebrow = tStr(carsPage?.eyebrow, locale) || resolveCopy(copy?.eyebrow, locale, t.cars.eyebrow)
  const title = tStr(carsPage?.title, locale) || resolveCopy(copy?.title, locale, t.cars.title)
  const titleEm = tStr(carsPage?.titleEm, locale) || resolveCopy(copy?.titleEm, locale, t.cars.titleEm)
  const lead = tStr(carsPage?.lead, locale) || resolveCopy(copy?.lead, locale, t.cars.lead)
  const bannerImage = carsPage?.bannerImage

  return (
    <PageHero
      eyebrow={eyebrow}
      title={title}
      titleEm={titleEm}
      lead={lead}
      bannerImage={bannerImage}
    >
      <div className="mt-8 flex flex-wrap gap-3">
        <LocaleLink
          href="#for-sale"
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Store className="size-4" aria-hidden="true" />
          {resolveCopy(copy?.ctaSale, locale, t.cars.ctaSale)}
          <ArrowUpRight className="size-4" aria-hidden="true" data-flip-rtl />
        </LocaleLink>
        <LocaleLink
          href="#import"
          className="flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Ship className="size-4" aria-hidden="true" />
          {resolveCopy(copy?.ctaImport, locale, t.cars.ctaImport)}
        </LocaleLink>
      </div>
    </PageHero>
  )
}
