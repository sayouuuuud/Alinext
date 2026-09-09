'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Globe2, ShieldCheck, Truck, Plane, Ship } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useSiteContent } from '@/lib/admin/site-content-context'

gsap.registerPlugin(ScrollTrigger)

type NavigatorWithDeviceHints = Navigator & {
  connection?: { saveData?: boolean }
  deviceMemory?: number
}

type GlobeController = ReturnType<(typeof import('cobe'))['default']>

function locationToAngles(lat: number, lng: number): [number, number] {
  return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180]
}

function canUseInteractiveGlobe() {
  if (typeof window === 'undefined') return false

  const device = navigator as NavigatorWithDeviceHints
  const hasLimitedMemory = device.deviceMemory !== undefined && device.deviceMemory <= 4
  const hasLimitedCpu = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4

  return (
    window.matchMedia('(min-width: 1024px)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !device.connection?.saveData &&
    !hasLimitedMemory &&
    !hasLimitedCpu
  )
}

export function GlobalReach() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { t, locale } = useLanguage()
  const { content, tStr } = useSiteContent()

  const g = content.pages?.home?.globalReach
  const reachTitle = tStr(g?.title, locale) || t.import.title
  const reachSubtitle = tStr(g?.subtitle, locale) || t.import.titleEm
  const reachLead = tStr(g?.description, locale) || t.import.lead

  const IMPORT_FEATURES = [
    {
      icon: Globe2,
      title: t.import.step1Title,
      text: t.import.step1Desc,
      city: 'London',
      lat: 51.5074,
      lng: -0.1278,
    },
    {
      icon: ShieldCheck,
      title: t.import.step3Title,
      text: t.import.step3Desc,
      city: 'Beijing',
      lat: 39.9042,
      lng: 116.4074,
    },
    {
      icon: Truck,
      title: t.import.step4Title,
      text: t.import.step4Desc,
      city: 'New York',
      lat: 40.7128,
      lng: -74.006,
    },
  ]

  const phiRef = useRef(locationToAngles(30.0444, 31.2357)[0])
  const thetaRef = useRef(0.3)
  const focusRef = useRef<[number, number] | null>(null)
  const visibleRef = useRef(false)
  const interactiveRef = useRef(false)
  const draggingRef = useRef(false)
  const pointerStartX = useRef(0)
  const dragStartOffset = useRef(0)

  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const dragOffset = useMotionValue(0)
  const springOffset = useSpring(dragOffset, { mass: 1, stiffness: 280, damping: 40 })

  const focusCity = useCallback((lat: number, lng: number, city: string) => {
    if (!interactiveRef.current) return
    focusRef.current = locationToAngles(lat, lng)
    setActiveCity(city)
  }, [])

  const releaseFocus = useCallback(() => {
    if (!interactiveRef.current) return
    focusRef.current = null
    setActiveCity(null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper || !canUseInteractiveGlobe()) return

    let disposed = false
    let globe: GlobeController | null = null
    let raf = 0
    let idleHandle = 0
    let fallbackTimer = 0
    let width = Math.max(wrapper.offsetWidth, 1)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const stopLoop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    const drawFrame = () => {
      if (!globe) return

      const focus = focusRef.current
      if (focus) {
        const [targetPhi, targetTheta] = focus
        const spring = springOffset.get()
        const currentTotal = phiRef.current + spring
        const distA = (targetPhi - currentTotal) % (Math.PI * 2)
        const distB = distA - Math.PI * 2 * Math.sign(distA)
        const dist = Math.abs(distA) < Math.abs(distB) ? distA : distB
        phiRef.current += dist * 0.08
        thetaRef.current += (targetTheta * 0.9 - thetaRef.current) * 0.08
      } else {
        if (!draggingRef.current) phiRef.current += 0.005
        thetaRef.current += (0.3 - thetaRef.current) * 0.05
      }

      const bufferSize = Math.round(width * dpr)
      globe.update({
        phi: phiRef.current + springOffset.get(),
        theta: thetaRef.current,
        width: bufferSize,
        height: bufferSize,
      })
    }

    const tick = () => {
      raf = 0
      if (disposed || !visibleRef.current || document.hidden) return
      drawFrame()
      raf = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (raf || disposed || !globe || !visibleRef.current || document.hidden) return
      raf = requestAnimationFrame(tick)
    }

    const visibility = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) startLoop()
        else stopLoop()
      },
      { rootMargin: '300px 0px', threshold: 0 }
    )

    const resizeObserver = new ResizeObserver(() => {
      width = Math.max(wrapper.offsetWidth, 1)
    })

    const onVisibilityChange = () => {
      if (document.hidden) stopLoop()
      else startLoop()
    }

    const onPointerDown = (event: PointerEvent) => {
      draggingRef.current = true
      pointerStartX.current = event.clientX
      dragStartOffset.current = dragOffset.get()
      canvas.style.cursor = 'grabbing'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return
      dragOffset.set(dragStartOffset.current + (event.clientX - pointerStartX.current) / 200)
    }

    const onPointerUp = () => {
      draggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    const initialize = async () => {
      try {
        const { default: createGlobe } = await import('cobe')
        if (disposed) return

        const bufferSize = Math.round(width * dpr)
        globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: bufferSize,
          height: bufferSize,
          phi: phiRef.current,
          theta: thetaRef.current,
          dark: 0,
          diffuse: 0.9,
          mapSamples: 8000,
          mapBrightness: 5,
          baseColor: [0.32, 0.44, 0.62],
          markerColor: [0.05, 0.35, 0.95],
          glowColor: [0.92, 0.95, 1],
          markers: [],
        })

        // Prime WebGL while the browser is idle so shader compilation cannot
        // interrupt the user's first scroll into this section.
        drawFrame()
        interactiveRef.current = true
        setReady(true)

        visibility.observe(wrapper)
        resizeObserver.observe(wrapper)
        document.addEventListener('visibilitychange', onVisibilityChange)
        canvas.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
      } catch {
        // The local still remains visible if WebGL is unavailable or blocked.
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(() => void initialize(), { timeout: 1800 })
    } else {
      fallbackTimer = window.setTimeout(() => void initialize(), 400)
    }

    return () => {
      disposed = true
      interactiveRef.current = false
      visibleRef.current = false
      stopLoop()
      if (idleHandle) window.cancelIdleCallback(idleHandle)
      window.clearTimeout(fallbackTimer)
      visibility.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      globe?.destroy()
    }
  }, [dragOffset, springOffset])

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.from('[data-globe-copy]', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
      gsap.from('[data-globe-feature]', {
        x: -24,
        opacity: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      })
      gsap.from('[data-globe-canvas]', {
        scale: 0.85,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
      gsap.from('[data-globe-chip]', {
        scale: 0,
        opacity: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 0.6,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })

      // The static version keeps the same composition without perpetual
      // compositing on mobile and constrained devices.
      if (!canUseInteractiveGlobe()) return

      const ambient = [
        gsap.to('[data-orbit-ring]', {
          rotate: 360,
          duration: 40,
          repeat: -1,
          ease: 'none',
          transformOrigin: '50% 50%',
          paused: true,
        }),
        gsap.to('[data-orbit-ring-2]', {
          rotate: -360,
          duration: 55,
          repeat: -1,
          ease: 'none',
          transformOrigin: '50% 50%',
          paused: true,
        }),
        ...gsap.utils.toArray<HTMLElement>('[data-globe-chip]').map((chip, index) =>
          gsap.to(chip, {
            y: index % 2 === 0 ? -12 : 12,
            duration: 2.4 + index * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            paused: true,
          })
        ),
        gsap.to('[data-satellite-track]', {
          rotate: 360,
          duration: 22,
          repeat: -1,
          ease: 'none',
          transformOrigin: '50% 50%',
          paused: true,
        }),
        gsap.to('[data-satellite]', {
          rotate: -360,
          duration: 22,
          repeat: -1,
          ease: 'none',
          transformOrigin: '50% 50%',
          paused: true,
        }),
      ]

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) =>
          ambient.forEach((tween) => (self.isActive ? tween.play() : tween.pause())),
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="importing" className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 flex flex-col gap-8 lg:order-1">
            <div className="flex flex-col gap-4">
              <p
                data-globe-copy
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
              >
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                {t.import.eyebrow}
              </p>
              <h2
                data-globe-copy
                className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl"
              >
                {reachTitle}{' '}
                <em className="font-serif italic text-accent">{reachSubtitle}</em>
              </h2>
              <p data-globe-copy className="max-w-md text-pretty leading-relaxed text-muted-foreground">
                {reachLead}
              </p>
            </div>

            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {IMPORT_FEATURES.map((feature) => {
                const isActive = activeCity === feature.city
                return (
                  <li key={feature.title} data-globe-feature>
                    <button
                      type="button"
                      onMouseEnter={() => focusCity(feature.lat, feature.lng, feature.city)}
                      onMouseLeave={releaseFocus}
                      onFocus={() => focusCity(feature.lat, feature.lng, feature.city)}
                      onBlur={releaseFocus}
                      className={`group flex w-full items-start gap-4 px-2 py-5 text-start transition-colors duration-300 ${
                        isActive ? 'bg-secondary' : 'bg-transparent'
                      }`}
                      aria-label={`${feature.title} — focus globe on ${feature.city}`}
                    >
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          isActive
                            ? 'scale-110 bg-accent text-accent-foreground'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        <feature.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1 text-start">
                        <span
                          className={`font-medium transition-transform duration-300 ${
                            isActive
                              ? 'ltr:translate-x-1 rtl:-translate-x-1 text-accent'
                              : 'text-foreground'
                          }`}
                        >
                          {feature.title}
                        </span>
                        <span className="text-start text-sm leading-relaxed text-muted-foreground">
                          {feature.text}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="order-1 flex items-center justify-center lg:order-2">
            <div
              data-globe-canvas
              className="relative aspect-square w-[min(620px,92vw)] md:w-[600px] lg:w-[660px]"
            >
              <svg
                data-orbit-ring
                className="pointer-events-none absolute inset-0 h-full w-full text-accent/25"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="49"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.4"
                  strokeDasharray="2 3"
                />
              </svg>
              <svg
                data-orbit-ring-2
                className="pointer-events-none absolute inset-[8%] h-[84%] w-[84%] text-border"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="49"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.3"
                  strokeDasharray="1 6"
                />
              </svg>

              <div
                data-satellite-track
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                <div
                  data-satellite
                  className="absolute left-1/2 top-0 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-accent shadow-sm backdrop-blur-md"
                >
                  <Plane className="size-4" />
                </div>
                <div
                  data-satellite
                  className="absolute bottom-0 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-accent shadow-sm backdrop-blur-md"
                >
                  <Ship className="size-4" />
                </div>
              </div>

              <div
                ref={wrapperRef}
                role="img"
                aria-label="3D globe showing ALI FLEET import markets worldwide"
                className="absolute inset-[1%]"
                style={{ contain: 'layout paint size' }}
              >
                <Image
                  src="/images/global-reach-fallback.png"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 660px, (min-width: 768px) 600px, 92vw"
                  className={`object-contain transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
                />
                <canvas
                  ref={canvasRef}
                  className={`relative h-full w-full transition-opacity duration-700 ${ready ? 'cursor-grab opacity-100' : 'pointer-events-none opacity-0'}`}
                  style={{ aspectRatio: '1' }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at center, transparent 0%, transparent 70%, oklch(0.985 0.002 240 / 0.4) 86%, var(--background) 99%)',
                  }}
                  aria-hidden="true"
                />
              </div>

              <div
                data-globe-chip
                className="absolute -left-2 top-[18%] flex items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md md:-left-6"
              >
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                {t.home.globeCountries}
              </div>
              <div
                data-globe-chip
                className="absolute -right-2 top-[62%] flex items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md md:-right-6"
              >
                <span className="size-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
                {t.home.globeTracking}
              </div>

              {activeCity ? (
                <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-border bg-background/90 px-4 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-md">
                  {activeCity}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
