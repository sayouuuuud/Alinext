'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useSiteContent } from '@/lib/admin/site-content-context'

export function MarqueeStrip() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const { t, locale } = useLanguage()
  const { content, tStr } = useSiteContent()

  const defaultItems = [
    t.home.fleet.truckTitle,
    t.footer.servicesLinks.import,
    t.products.trustGenuine,
    t.home.fleet.luxuryTitle,
    t.footer.servicesLinks.parts,
  ]

  const items =
    content.pages?.home?.marquee && content.pages.home.marquee.length > 0
      ? content.pages.home.marquee
          .map((m) => tStr(m, locale))
          .filter(Boolean)
      : defaultItems

  useGSAP(
    () => {
      const scroll = gsap.to('[data-marquee-track]', {
        xPercent: -50,
        repeat: -1,
        duration: 30,
        ease: 'none',
        paused: true,
      })

      // Only animate while the strip is visible — an always-on transform on a
      // wide element forces the compositor to work during unrelated scrolling.
      const observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? scroll.play() : scroll.pause()),
        { threshold: 0 }
      )
      if (wrapRef.current) observer.observe(wrapRef.current)
      return () => observer.disconnect()
    },
    { scope: wrapRef }
  )

  return (
    <div
      ref={wrapRef}
      className="overflow-hidden border-y border-border bg-background py-5"
      aria-hidden="true"
    >
      <div data-marquee-track className="flex w-max items-center gap-12">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-12 whitespace-nowrap text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground"
          >
            {item}
            <span className="size-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  )
}
