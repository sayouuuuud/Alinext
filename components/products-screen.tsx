'use client'

import { PackageX } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import type { CatalogCategory, PartSummary } from '@/lib/data/parts'
import type { CatalogStatus } from '@/lib/content/catalog'
import { useLanguage } from '@/lib/i18n/language-context'
import { PageHero } from '@/components/page-hero'
import { ProductsBrowser } from '@/components/products-browser'
import { useSiteContent } from '@/lib/admin/site-content-context'

export function ProductsScreen({
  parts,
  categories,
  status,
  hasUntranslated,
}: {
  parts: PartSummary[]
  categories: CatalogCategory[]
  status: CatalogStatus
  hasUntranslated: boolean
}) {
  const { t, locale } = useLanguage()
  const { content, tStr } = useSiteContent()
  const productsPage = content?.pages?.products

  return (
    <>
      <PageHero
        eyebrow={tStr(productsPage?.eyebrow, locale) || t.products.eyebrow}
        title={tStr(productsPage?.title, locale) || t.products.title}
        titleEm={tStr(productsPage?.titleEm, locale) || t.products.titleEm}
        lead={tStr(productsPage?.lead, locale) || t.products.lead}
        bannerImage={productsPage?.bannerImage}
      />

      {parts.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
          <div className="flex flex-col items-center rounded-3xl bg-card p-12 text-center ring-1 ring-border md:p-20">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
              <PackageX className="size-7 text-muted-foreground" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-2xl text-foreground md:text-3xl">
              {status === 'empty'
                ? t.products.catalogEmpty
                : t.products.catalogUnavailable}
            </h2>
            <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              {status === 'empty'
                ? t.products.catalogEmptyLead
                : t.products.catalogUnavailableLead}
            </p>
            <LocaleLink
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-base font-semibold text-background transition-opacity hover:opacity-90"
            >
              {t.nav.contact}
            </LocaleLink>
          </div>
        </section>
      ) : (
        <>
          {hasUntranslated && (
            <div className="mx-auto max-w-7xl px-4 pb-6 md:px-8">
              <p className="rounded-2xl bg-secondary px-5 py-3.5 text-sm leading-relaxed text-muted-foreground">
                {t.products.untranslatedNotice}
              </p>
            </div>
          )}
          <ProductsBrowser parts={parts} categories={categories} />
        </>
      )}
    </>
  )
}
