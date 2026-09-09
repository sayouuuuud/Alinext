import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { TrackOrderScreen } from '@/components/track-order-screen'

export const metadata: Metadata = {
  title: 'تتبع طلبك | Track Order | מעקב הזמנה — ALI FLEET',
  description:
    'تتبع حالة شحنتك والقطع أو السيارات المطلوبة من علي فليت لحظة بلحظة مع تفاصيل الشحن والتوصيل.',
}

export default function TrackOrderPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <TrackOrderScreen />
      </main>
      <SiteFooter />
    </>
  )
}
