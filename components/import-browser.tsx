'use client'

import { useMemo, useState } from 'react'
import { carOrigins, carStatuses } from '@/lib/data/import-cars'
import { Paginator } from '@/components/paginator'
import type { CarOrigin, CarStatus, ImportCar } from '@/lib/data/import-cars'
import type { VehiclesStatus } from '@/lib/wp/vehicles'
import { useLanguage } from '@/lib/i18n/language-context'
import { resolveCopy } from '@/lib/i18n/copy-block'
import type { CarsPageCopy } from '@/lib/wp/cars-page'
import { ImportCarCard } from '@/components/import-car-card'
import LocaleLink from '@/components/locale-link'
import { useSiteContent } from '@/lib/admin/site-content-context'

type Props = {
  cars: ImportCar[]
  status: VehiclesStatus
  /** CMS overrides for the section heading; falls back to the dictionary. */
  copy?: CarsPageCopy['importHeader']
}

export function ImportBrowser({ cars, status, copy }: Props) {
  const { t, locale } = useLanguage()
  const { content } = useSiteContent()
  const [origin, setOrigin] = useState<CarOrigin | 'all'>('all')
  const [carStatus, setCarStatus] = useState<CarStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6 // 2 rows × 3 cols

  // Map admin import cars to ImportCar shape
  const adminImportCars: ImportCar[] = useMemo(() => {
    if (!content?.cars) return []
    return content.cars
      .filter((c) => c.type === 'import')
      .map((c) => ({
        slug: c.id,
        model: `${c.make} ${c.model}`,
        subtitle: {
          ar: c.title?.ar || c.make,
          en: c.title?.en || c.make,
          he: c.title?.he || c.make,
        },
        bodyType: {
          ar: c.specs?.bodyType || 'مركبة استيراد',
          en: c.specs?.bodyType || 'Import Vehicle',
          he: c.specs?.bodyType || 'רכב ייבוא',
        },
        origin: 'germany' as CarOrigin,
        status: (c.status === 'incoming' ? 'inTransit' : c.status === 'sold' ? 'sold' : c.status === 'reserved' ? 'reserved' : 'available') as CarStatus,
        stage: 2 as const,
        year: c.year,
        mileage: parseInt(String(c.mileage || '0').replace(/[^0-9]/g, '')) || 0,
        price: c.price,
        featured: c.featured,
        image: c.image || '/images/import-heavy-truck.png',
        alt: { ar: c.title?.ar || '', en: c.title?.en || '', he: c.title?.he || '' },
        gallery: (c.images && c.images.length > 0 ? c.images : [c.image]).filter(Boolean).map((img) => ({
          src: img,
          alt: { ar: c.title?.ar || '', en: c.title?.en || '', he: c.title?.he || '' },
        })),
        description: {
          ar: c.description?.ar || '',
          en: c.description?.en || '',
          he: c.description?.he || '',
        },
        highlights: [],
        specs: {
          engine: c.specs?.engine || 'Euro 6 Engine',
          transmission: {
            ar: c.transmission || 'أوتوماتيك',
            en: c.transmission || 'Automatic',
            he: c.transmission || 'אוטומטי',
          },
          fuel: {
            ar: c.fuel || 'ديزل',
            en: c.fuel || 'Diesel',
            he: c.fuel || 'דיזל',
          },
          drivetrain: 'Heavy-Duty AWD',
          color: {
            ar: c.specs?.color || 'أبيض',
            en: c.specs?.color || 'White',
            he: c.specs?.color || 'לבן',
          },
          seats: 4,
        },
        eta: {
          ar: 'خلال 14-21 يوم عمل',
          en: '14-21 business days',
          he: '14-21 ימי עסקים',
        },
      }))
  }, [content?.cars])

  const effectiveCars = adminImportCars.length > 0 ? adminImportCars : cars
  const effectiveStatus = effectiveCars.length > 0 ? 'ok' : status

  const filtered = useMemo(
    () =>
      effectiveCars.filter(
        (car) =>
          (origin === 'all' || car.origin === origin) &&
          (carStatus === 'all' || car.status === carStatus)
      ),
    [effectiveCars, origin, carStatus]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const goToPage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const chip = (active: boolean) =>
    active
      ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
      : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-secondary hover:text-foreground'

  /* ---------- empty / error states served from server data ---------- */
  if (effectiveStatus === 'not_configured' || effectiveStatus === 'unreachable') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="font-semibold text-foreground">
            {t.import.inventoryUnavailable}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.import.inventoryUnavailableLead}
          </p>
          <LocaleLink
            href="/contact"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.callUs}
          </LocaleLink>
        </div>
      </section>
    )
  }

  if (status === 'acf_missing') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <p className="font-semibold text-foreground">
            {t.import.inventoryAcfMissing}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.import.inventoryAcfMissingLead}
          </p>
        </div>
      </section>
    )
  }

  if (status === 'empty') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="font-semibold text-foreground">
            {t.import.inventoryEmpty}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.import.inventoryEmptyLead}
          </p>
          <LocaleLink
            href="/contact"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.callUs}
          </LocaleLink>
        </div>
      </section>
    )
  }

  /* ---------- normal grid ---------- */
  return (
    <section id="available" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
        {resolveCopy(copy?.eyebrow, locale, t.import.listEyebrow)}
      </p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
        {resolveCopy(copy?.title, locale, t.import.listTitle)}
      </h2>
      <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
        {resolveCopy(copy?.lead, locale, t.import.listLead)}
      </p>

      <div className="mt-10 flex flex-col gap-5 border-y border-border py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t.import.filterOrigin}
          </span>
          <button type="button" onClick={() => { setOrigin('all'); setPage(1) }} className={chip(origin === 'all')}>
            {t.common.all}
          </button>
          {carOrigins.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setOrigin(item); setPage(1) }}
              className={chip(origin === item)}
            >
              {t.import.origins[item]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t.import.filterStatus}
          </span>
          <button
            type="button"
            onClick={() => { setCarStatus('all'); setPage(1) }}
            className={chip(carStatus === 'all')}
          >
            {t.common.all}
          </button>
          {carStatuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setCarStatus(item); setPage(1) }}
              className={chip(carStatus === item)}
            >
              {t.import.status[item]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        <span dir="ltr">{filtered.length}</span> {t.common.resultsCount}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="text-muted-foreground">{t.common.noResults}</p>
          <button
            type="button"
            onClick={() => {
              setOrigin('all')
              setCarStatus('all')
              setPage(1)
            }}
            className="mt-4 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.clearFilters}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((car) => (
              <ImportCarCard key={car.slug} car={car} />
            ))}
          </div>

          {totalPages > 1 && (
            <Paginator current={safePage} total={totalPages} onChange={goToPage} prevLabel={t.common.prevPage} nextLabel={t.common.nextPage} />
          )}
        </>
      )}
    </section>
  )
}
