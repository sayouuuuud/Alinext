'use client'

import Image from 'next/image'
import LocaleLink from '@/components/locale-link'
import { Mail, MapPin, Phone, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useStore } from '@/lib/store-context'
import { useSiteContent } from '@/lib/admin/site-content-context'

export function SiteFooter() {
  const { t, locale } = useLanguage()
  const store = useStore()
  const { content, tStr } = useSiteContent()

  const customLogo = content.branding?.logoDarkUrl || content.branding?.logoLightUrl || '/images/ali-fleet-logo.png'
  const customTagline = tStr(content.branding?.tagline, locale) || t.footer.tagline
  const rightsText = tStr(content.general?.footer?.rights, locale) || t.footer.rights
  const sloganText = tStr(content.general?.footer?.slogan, locale) || t.footer.slogan

  // Social profiles are managed from the admin (general.social) — a network
  // only renders once it actually has a URL configured.
  const social = content.general?.social
  const socialLinks = [
    { label: 'Instagram', href: social?.instagram, icon: Instagram },
    { label: 'Facebook', href: social?.facebook, icon: Facebook },
    { label: 'LinkedIn', href: social?.linkedin, icon: Linkedin },
    { label: 'TikTok', href: social?.tiktok, icon: null },
    { label: 'YouTube', href: social?.youtube, icon: Youtube },
  ].filter((s) => s.href)

  const columns = [
    {
      heading: t.footer.fleet,
      links: [
        // These used to carry `?type=` params that nothing ever read. The two
        // anchors are the real filters the page offers.
        { label: t.footer.fleetLinks.trucks, href: '/cars#for-sale' },
        { label: t.footer.fleetLinks.vans, href: '/cars#for-sale' },
        { label: t.footer.fleetLinks.luxury, href: '/cars#import' },
        { label: t.footer.fleetLinks.used, href: '/cars#for-sale' },
      ],
    },
    {
      heading: t.footer.services,
      links: [
        { label: t.footer.servicesLinks.import, href: '/cars#import' },
        { label: t.footer.servicesLinks.parts, href: '/products' },
        { label: t.footer.servicesLinks.consulting, href: '/contact' },
        { label: t.footer.servicesLinks.support, href: '/contact' },
      ],
    },
    {
      heading: t.footer.company,
      links: [
        { label: t.footer.companyLinks.about, href: '/#fleet' },
        { label: t.footer.companyLinks.careers, href: '/contact' },
        { label: t.footer.companyLinks.news, href: '/blog' },
        { label: t.footer.companyLinks.contact, href: '/contact' },
      ],
    },
  ]

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <img
              src={customLogo}
              alt="ALI FLEET logo"
              className="h-11 w-auto object-contain"
            />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {customTagline}
            </p>
            {/* Contact rows come from the site content, so each one is only rendered
                once it actually has a value — an empty tel: link is worse than
                no link at all. */}
            <ul className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
              {store.phone && (
                <li>
                  <a
                    href={store.phoneHref}
                    className="flex items-center gap-2.5 transition-colors hover:text-primary"
                  >
                    <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span dir="ltr">{store.phone}</span>
                  </a>
                </li>
              )}
              {store.email && (
                <li>
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center gap-2.5 transition-colors hover:text-primary"
                  >
                    <Mail className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span dir="ltr">{store.email}</span>
                  </a>
                </li>
              )}
              {store.addressLines.length > 0 && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{store.addressLines.join(', ')}</span>
                </li>
              )}
            </ul>

            {socialLinks.length > 0 && (
              <ul className="mt-6 flex items-center gap-2">
                {socialLinks.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                    >
                      {s.icon ? (
                        <s.icon className="size-4" aria-hidden="true" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <LocaleLink
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {store.name}. {rightsText}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <LocaleLink
              href="/privacy-policy"
              className="transition-colors hover:text-foreground"
            >
              {locale === 'ar' ? 'سياسة الخصوصية' : locale === 'he' ? 'מדיניות הפרטיות' : 'Privacy Policy'}
            </LocaleLink>
            <LocaleLink
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              {locale === 'ar' ? 'الشروط والأحكام' : locale === 'he' ? 'תנאים והגבלות' : 'Terms & Conditions'}
            </LocaleLink>
            <LocaleLink
              href="/return-policy"
              className="transition-colors hover:text-foreground"
            >
              {locale === 'ar' ? 'سياسة الإرجاع والاستبدال' : locale === 'he' ? 'מדיניות החזרה והחלפה' : 'Refund & Returns'}
            </LocaleLink>
          </div>
          <p>{sloganText}</p>
        </div>
      </div>
    </footer>
  )
}
