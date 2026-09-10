import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {
  Geist,
  Geist_Mono,
  Fraunces,
  Cairo,
  Noto_Sans_Hebrew,
} from 'next/font/google'
import './globals.css'
import { MetaPixel } from '@/components/analytics/meta-pixel'
import { BackToTop } from '@/components/back-to-top'
import { SiteLoader } from '@/components/site-loader'
import { LanguageProvider } from '@/lib/i18n/language-context'
import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth/auth-context'
import { loadViewer } from '@/lib/auth/queries'
import { loadCartLines } from '@/lib/commerce/queries'
import { StoreProvider } from '@/lib/store-context'
import { siteUrl } from '@/lib/seo'
import { serializeJsonLd } from '@/lib/json-ld'
import { getStoreSettings } from '@/lib/content/settings'
import { getSiteContent } from '@/lib/content/repository'
import { localeMeta } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { SiteContentProvider } from '@/lib/admin/site-content-context'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
})
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
})
const notoHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew'],
  variable: '--font-noto-hebrew',
})

const SITE_NAME = 'ALI FLEET'
const SITE_TITLE = 'ALI FLEET — Luxurious Commercial Vehicles, Import & Spare Parts'
const SITE_DESCRIPTION =
  'ALI FLEET delivers luxurious commercial vehicles — new and used — global importing of trucks and luxury vehicles, and genuine spare parts services worldwide.'

export const metadata: Metadata = {
  // metadataBase turns every relative image and canonical path below into an
  // absolute URL. Without it Open Graph previews resolve against localhost and
  // social platforms silently drop the image.
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_TITLE,
    // Inner pages set only their own name; this keeps the brand in the tab.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: siteUrl(),
    images: [
      {
        url: '/images/fleet-truck.png',
        width: 1024,
        height: 1024,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/images/fleet-truck.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // app/icon.png and app/apple-icon.png are picked up automatically by the
  // file convention; these entries also cover the shortcut/legacy slots.
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#fafafa',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The proxy resolves indexed URL locales before the cookie, so the first
  // paint always has the canonical language and direction.
  const locale = await getRequestLocale()
  const meta = localeMeta[locale]

  const [storeSettings, initialSiteContent, viewer, initialCartLines] = await Promise.all([
    getStoreSettings(locale),
    getSiteContent(),
    loadViewer(),
    loadCartLines(),
  ])

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`bg-background ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${cairo.variable} ${notoHebrew.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased">
        {/* Organization data comes from the same local content source as the site. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'AutoPartsStore',
              name: SITE_NAME,
              description: SITE_DESCRIPTION,
              url: siteUrl(),
              image: `${siteUrl()}/images/fleet-truck.png`,
              telephone: storeSettings.phone || undefined,
              email: storeSettings.email || undefined,
              openingHours: storeSettings.hours || undefined,
              address: storeSettings.addressLines.length
                ? {
                    '@type': 'PostalAddress',
                    streetAddress: storeSettings.addressLines[0],
                    addressLocality: storeSettings.addressLines[1],
                    addressCountry: 'IL',
                  }
                : undefined,
              sameAs: [
                storeSettings.social.instagram,
                storeSettings.social.facebook,
                storeSettings.social.linkedin,
              ].filter(Boolean),
            }),
          }}
        />
        <SiteLoader />
        <MetaPixel />
        <LanguageProvider initialLocale={locale}>
          <SiteContentProvider initialContent={initialSiteContent}>
            <StoreProvider>
              <AuthProvider viewer={viewer} backendReady>
                <CartProvider initialLines={initialCartLines}>{children}</CartProvider>
              </AuthProvider>
            </StoreProvider>
          </SiteContentProvider>
        </LanguageProvider>
        <BackToTop />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
