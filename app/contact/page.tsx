import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ContactSection } from '@/components/contact-section'
import { getPublicMetadata } from '@/lib/content/metadata'
import { getRequestLocale } from '@/lib/i18n/request-locale'

export async function generateMetadata(): Promise<Metadata> {
  return getPublicMetadata({
    entityType: 'page',
    entityId: 'contact',
    locale: await getRequestLocale(),
    fallback: {
      title: 'Contact | ALI FLEET',
      description: 'Talk to ALI FLEET about spare parts, vehicle imports, or a fleet plan.',
      path: '/contact',
      image: '/images/contact-hero.png',
    },
  })
}

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  )
}
