'use client'

import type { PartSummary } from '@/lib/data/parts'
import { useLanguage } from '@/lib/i18n/language-context'
import { useSiteContent } from '@/lib/admin/site-content-context'
import { PageHero } from '@/components/page-hero'
import { CartView } from '@/components/cart-view'

/**
 * Client shell for the cart page. The catalog arrives from the server so the
 * hero copy can stay localized here while prices come from a fresh read
 * rather than whatever the browser cached.
 */
export function CartScreen({ catalog }: { catalog: PartSummary[] }) {
  const { t, locale } = useLanguage()
  const { content, tStr } = useSiteContent()

  // The cart page header is admin-editable (pages.cart); dictionary is fallback.
  const page = content.pages?.cart
  const eyebrow = tStr(page?.eyebrow, locale) || t.nav.cart
  const title = tStr(page?.title, locale) || t.cart.title
  const lead = tStr(page?.lead, locale) || t.cart.lead

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} lead={lead} bannerImage={page?.bannerImage} />
      <CartView catalog={catalog} />
    </>
  )
}
