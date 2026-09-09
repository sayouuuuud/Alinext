'use client'

import { useMemo, useState } from 'react'
import LocaleLink from '@/components/locale-link'
import { saleCarConditions, saleCarStatuses } from '@/lib/data/sale-cars'
import type { SaleCar, SaleCarCondition, SaleCarStatus } from '@/lib/data/sale-cars'
import type { SaleCarsStatus } from '@/lib/wp/sale-cars'
import { Paginator } from '@/components/paginator'
import { useLanguage } from '@/lib/i18n/language-context'
import { resolveCopy } from '@/lib/i18n/copy-block'
import type { CarsPageCopy } from '@/lib/wp/cars-page'
import { SaleCarCard } from '@/components/sale-car-card'
import { useSiteContent } from '@/lib/admin/site-content-context'

type Props = {
  cars: SaleCar[]
  status: SaleCarsStatus
  /** CMS overrides for the section heading; falls back to the dictionary. */
  copy?: CarsPageCopy['saleHeader']
}

export function SaleBrowser({ cars, status, copy }: Props) {
  const { t, locale } = useLanguage()
  const { content } = useSiteContent()
  const [condition, setCondition] = useState<SaleCarCondition | 'all'>('all')
  const [carStatus, setCarStatus] = useState<SaleCarStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6 // 2 rows × 3 cols

  // Map admin cars to SaleCar shape
  const adminSaleCars: SaleCar[] = useMemo(() => {
    if (!content?.cars) return []
    return content.cars
      .filter((c) => c.type === 'sale')
      .map((c) => ({
        slug: c.id,
        model: `${c.make} ${c.model}`,
        subtitle: {
          ar: c.title?.ar || c.make,
          en: c.title?.en || c.make,
          he: c.title?.he || c.make,
        },
        bodyType: {
          ar: c.specs?.bodyType || 'شاحنة / مركبة تجارية',
          en: c.specs?.bodyType || 'Commercial Vehicle',
          he: c.specs?.bodyType || 'רכב מסחרי',
        },
        condition: 'used' as const,
        status: (c.status === 'sold' ? 'sold' : c.status === 'reserved' ? 'reserved' : 'available') as SaleCarStatus,
        year: c.year,
        mileage: parseInt(String(c.mileage || '0').replace(/[^0-9]/g, '')) || 0,
        price: c.price,
        previousOwners: 1,
        featured: c.featured,
        image: c.image || '/images/fleet-truck.png',
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
          engine: c.specs?.engine || 'Commercial Engine',
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
          drivetrain: 'Heavy-Duty 4x2 / 6x4',
          color: {
            ar: c.specs?.color || 'أبيض',
            en: c.specs?.color || 'White',
            he: c.specs?.color || 'לבן',
          },
          seats: 3,
        },
        availability: {
          ar: 'متوفرة للتسليم الفوري من ساحة المعرض',
          en: 'Available for immediate yard delivery',
          he: 'זמין למסירה מיידית מהמגרש',
        },
      }))
  }, [content?.cars])

  const effectiveCars = adminSaleCars.length > 0 ? adminSaleCars : cars
  const effectiveStatus = effectiveCars.length > 0 ? 'ok' : status

  const filtered = useMemo(
    () =>
      effectiveCars.filter(
        (car) =>
          (condition === 'all' || car.condition === condition) &&
          (carStatus === 'all' || car.status === carStatus)
      ),
    [effectiveCars, condition, carStatus]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const goToPage = (p: number) => {
    setPage(p)
    document.getElementById('for-sale')?.scrollIntoView({ behavior: 'smooth' })
  }

  const chip = (active: boolean) =>
    active
      ? 'rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background'
      : 'rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-secondary hover:text-foreground'

  /* ---------- section shell, shared by every branch ---------- */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <section id="for-sale" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
        {resolveCopy(copy?.eyebrow, locale, t.cars.saleEyebrow)}
      </p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
        {resolveCopy(copy?.title, locale, t.cars.saleTitle)}
      </h2>
      <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
        {resolveCopy(copy?.lead, locale, t.cars.saleLead)}
      </p>
      {children}
    </section>
  )

  if (effectiveStatus === 'not_configured' || effectiveStatus === 'unreachable') {
    return (
      <Shell>
        <div className="mt-10 rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="font-semibold text-foreground">{t.cars.saleUnavailable}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.cars.saleUnavailableLead}
          </p>
          <LocaleLink
            href="/contact"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.callUs}
          </LocaleLink>
        </div>
      </Shell>
    )
  }

  if (effectiveStatus === 'acf_missing') {
    return (
      <Shell>
        <div className="mt-10 rounded-3xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <p className="font-semibold text-foreground">{t.cars.saleAcfMissing}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.cars.saleAcfMissingLead}
          </p>
        </div>
      </Shell>
    )
  }

  if (effectiveStatus === 'empty') {
    return (
      <Shell>
        <div className="mt-10 rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="font-semibold text-foreground">{t.cars.saleEmpty}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t.cars.saleEmptyLead}</p>
          <LocaleLink
            href="/contact"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t.common.callUs}
          </LocaleLink>
        </div>
      </Shell>
    )
  }

  /* ---------- normal grid ---------- */
  return (
    <Shell>
      <div className="mt-10 flex flex-col gap-5 border-y border-border py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t.cars.filterCondition}
          </span>
          <button
            type="button"
            onClick={() => {
              setCondition('all')
              setPage(1)
            }}
            className={chip(condition === 'all')}
          >
            {t.common.all}
          </button>
          {saleCarConditions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCondition(item)
                setPage(1)
              }}
              className={chip(condition === item)}
            >
              {t.cars.conditions[item]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t.import.filterStatus}
          </span>
          <button
            type="button"
            onClick={() => {
              setCarStatus('all')
              setPage(1)
            }}
            className={chip(carStatus === 'all')}
          >
            {t.common.all}
          </button>
          {saleCarStatuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCarStatus(item)
                setPage(1)
              }}
              className={chip(carStatus === item)}
            >
              {t.cars.saleStatus[item]}
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
              setCondition('all')
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
              <SaleCarCard key={car.slug} car={car} />
            ))}
          </div>

          {totalPages > 1 && (
            <Paginator
              current={safePage}
              total={totalPages}
              onChange={goToPage}
              prevLabel={t.common.prevPage}
              nextLabel={t.common.nextPage}
            />
          )}
        </>
      )}
    </Shell>
  )
}
