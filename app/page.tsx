import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { StatsStrip } from '@/components/stats-strip'
import { GlobalReach } from '@/components/global-reach'
import { MarqueeStrip } from '@/components/marquee-strip'
import { FleetShowcase } from '@/components/fleet-showcase'
import { Services } from '@/components/services'
import { CtaSection } from '@/components/cta-section'
import { SiteFooter } from '@/components/site-footer'
import { getPageImages } from '@/lib/content/page-content'

export default async function Page() {
  const images = await getPageImages()

  return (
    <>
      <SiteHeader />
      <main>
        <Hero initialImages={images} />
        <StatsStrip />
        <FleetShowcase initialImages={images} />
        <MarqueeStrip />
        <GlobalReach />
        <Services initialImages={images} />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
