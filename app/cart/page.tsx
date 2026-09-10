import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartScreen } from '@/components/cart-screen'
import { getCatalog } from '@/lib/content/catalog'
import { loadCheckoutDefaults } from '@/lib/commerce/queries'

export const metadata: Metadata = {
  title: 'Cart | سلة المشتريات | ALI FLEET',
  description:
    'Review your selected commercial vehicle spare parts and proceed to secure checkout.',
  alternates: {
    canonical: '/cart',
  },
  robots: { index: false, follow: false },
}

export default async function CartPage() {
  const [{ parts }, checkoutDefaults] = await Promise.all([
    getCatalog(),
    loadCheckoutDefaults(),
  ])

  return (
    <>
      <SiteHeader />
      <main>
        <CartScreen catalog={parts} checkoutDefaults={checkoutDefaults} />
      </main>
      <SiteFooter />
    </>
  )
}
