import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartScreen } from '@/components/cart-screen'
import { getCatalog } from '@/lib/content/catalog'

export const metadata: Metadata = {
  title: 'Cart | سلة المشتريات | ALI FLEET',
  description:
    'Review your selected commercial vehicle spare parts and proceed to secure checkout.',
  alternates: {
    canonical: '/cart',
  },
}

export default async function CartPage() {
  // Resolve persisted cart slugs against the current local catalog snapshot.
  const { parts } = await getCatalog()

  return (
    <>
      <SiteHeader />
      <main>
        <CartScreen catalog={parts} />
      </main>
      <SiteFooter />
    </>
  )
}
