import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { TrackOrderScreen } from '@/components/track-order-screen'
import { loadTrackingOrders } from '@/lib/commerce/queries'

export const metadata: Metadata = {
  title: 'تتبع طلبك | Track Order | מעקב הזמנה — ALI FLEET',
  description:
    'تتبع حالة شحنتك والقطع أو السيارات المطلوبة من علي فليت لحظة بلحظة مع تفاصيل الشحن والتوصيل.',
  robots: { index: false, follow: false },
}

export default async function TrackOrderPage() {
  const tracking = await loadTrackingOrders()

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <TrackOrderScreen tracking={tracking} />
      </main>
      <SiteFooter />
    </>
  )
}
