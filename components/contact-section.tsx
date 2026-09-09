'use client'

import { Suspense } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useSiteContent } from '@/lib/admin/site-content-context'
import { PageHero } from '@/components/page-hero'
import { ContactDetails } from '@/components/contact-details'
import { ContactForm } from '@/components/contact-form'

export function ContactSection() {
  const { t, locale } = useLanguage()
  const { content, tStr } = useSiteContent()

  // The contact page header is admin-editable (pages.contact); dictionary is fallback.
  const page = content.pages?.contact

  return (
    <>
      <PageHero
        eyebrow={tStr(page?.eyebrow, locale) || t.contact.eyebrow}
        title={tStr(page?.title, locale) || t.contact.title}
        titleEm={tStr(page?.titleEm, locale) || t.contact.titleEm}
        lead={tStr(page?.lead, locale) || t.contact.lead}
        bannerImage={page?.bannerImage}
      />
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8 md:pb-28">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:gap-12">
          <ContactDetails />
          <Suspense
            fallback={
              <div className="rounded-3xl bg-card p-8 ring-1 ring-border">
                <p className="text-sm text-muted-foreground">{t.common.loading}</p>
              </div>
            }
          >
            <ContactForm />
          </Suspense>
        </div>
      </section>
    </>
  )
}
