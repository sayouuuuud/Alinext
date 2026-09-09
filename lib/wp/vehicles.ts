import 'server-only'

import type {
  CarOrigin,
  CarStatus,
  ImportCar,
} from '@/lib/data/import-cars'
import { carOrigins, carStatuses } from '@/lib/data/import-cars'
import { stripHtml } from '@/lib/i18n/machine-translations'
import { CATALOG_REVALIDATE, isWpConfigured } from './config'
import { wpFetch } from './client'
import {
  BODY_TYPES,
  PLACEHOLDER_IMAGE,
  type WireCommonFields,
  type WireImage,
  choice,
  commonCarFields,
  enumValue,
  gallery,
  highlights,
  int,
  localized,
  nullableNumber,
  plain,
  specs,
  text,
} from './car-fields'

/**
 * The live import-vehicle inventory, read from the `import_car` post type.
 *
 * Unlike the spare-parts catalog, a vehicle carries almost no useful data in
 * core WordPress fields — the title and featured image are all core gives us.
 * Year, mileage, price, origin, status and every localized string live in the
 * `importCarFields` ACF group (see `wordpress/acf/alifleet-acf-schema.json`).
 *
 * That makes ACF a hard dependency here, so the failure is reported rather than
 * hidden: if `wpgraphql-acf` is inactive the whole query fails and the page
 * says the inventory is unavailable, instead of rendering a grid of cars with
 * blank prices and no year.
 *
 * Everything this shares with the for-sale listings lives in `car-fields.ts`;
 * only the import-specific fields (`origin`, `stage`, `eta_*`) are here.
 */

const PAGE_SIZE = 50
const MAX_PAGES = 10

/* ------------------------------------------------------------------ queries */

/**
 * A single request, because ACF is not optional for vehicles. `importCarFields`
 * only exists once the ACF schema is imported and `wpgraphql-acf` is active.
 */
const VEHICLES_QUERY = /* GraphQL */ `
  query AliFleetVehicles($first: Int!, $after: String) {
    importCars(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        importCarFields {
          ${commonCarFields()}
          origin
          stage
          etaAr
          etaEn
          etaHe
        }
      }
    }
  }
`

/* -------------------------------------------------------------- wire shapes */

type WireCarFields = WireCommonFields & {
  origin?: string | string[] | null
  stage?: number | string | null
  etaAr?: string | null
  etaEn?: string | null
  etaHe?: string | null
}

type WireCar = {
  databaseId: number
  slug: string | null
  title: string | null
  featuredImage?: WireImage
  importCarFields: WireCarFields | null
}

type PagedCars = {
  importCars: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: WireCar[]
  } | null
}

export type VehiclesStatus =
  | 'ok'
  | 'not_configured'
  | 'unreachable'
  | 'empty'
  /** Reached WordPress, but `importCarFields` is missing from the schema. */
  | 'acf_missing'

export type VehicleInventory = {
  cars: ImportCar[]
  status: VehiclesStatus
}

/* ----------------------------------------------------------------- fetching */

/**
 * Reads the published inventory. Never throws — a missing ACF plugin, an
 * unreachable store and an empty inventory are three different states the UI
 * needs to tell apart.
 */
export async function getVehicles(): Promise<VehicleInventory> {
  if (!isWpConfigured()) {
    return { cars: [], status: 'not_configured' }
  }

  const collected: WireCar[] = []
  let after: string | null = null

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const data: PagedCars = await wpFetch<PagedCars>(
        VEHICLES_QUERY,
        { first: PAGE_SIZE, after },
        { revalidate: CATALOG_REVALIDATE }
      )
      const connection = data.importCars
      if (!connection) break

      collected.push(...connection.nodes)
      if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
        break
      }
      after = connection.pageInfo.endCursor
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // A schema error is a setup problem, not an outage, and the fix is
    // completely different — so it gets its own status.
    if (/importCarFields|Cannot query field/i.test(message)) {
      console.log(
        '[v0] Vehicle inventory needs WPGraphQL for ACF — importCarFields is not in the schema:',
        message
      )
      return { cars: [], status: 'acf_missing' }
    }
    console.log('[v0] Vehicle inventory fetch failed:', message)
    return { cars: [], status: 'unreachable' }
  }

  if (collected.length === 0) {
    return { cars: [], status: 'empty' }
  }

  const cars = collected
    .map(mapCar)
    .filter((car): car is ImportCar => car !== null)

  return { cars, status: cars.length > 0 ? 'ok' : 'empty' }
}

export async function getVehicle(slug: string): Promise<ImportCar | null> {
  const { cars } = await getVehicles()
  return cars.find((car) => car.slug === slug) ?? null
}

/**
 * Same body type first, then anything else, so the rail is never half empty
 * when a body type only holds one vehicle.
 */
export async function getSimilarVehicles(
  car: ImportCar,
  limit = 3
): Promise<ImportCar[]> {
  const { cars } = await getVehicles()
  const others = cars.filter((item) => item.slug !== car.slug)
  return [
    ...others.filter((item) => item.bodyType.en === car.bodyType.en),
    ...others.filter((item) => item.bodyType.en !== car.bodyType.en),
  ].slice(0, limit)
}

/* ------------------------------------------------------------------ mapping */

function mapCar(node: WireCar): ImportCar | null {
  const slug = node.slug?.trim()
  const fields = node.importCarFields
  if (!slug || !fields) return null

  // The post title is the safety net: a vehicle with no ACF model name still
  // needs something to render, and the title is what the editor typed.
  const model = text(fields.carModel) || stripHtml(node.title ?? '')
  if (!model) return null

  // ACF's own image field wins over the post thumbnail, because the schema
  // gives editors a dedicated field and that is the one they fill in.
  const heroNode = fields.featuredImage?.node ?? node.featuredImage?.node ?? null
  const heroAlt = text(heroNode?.altText)

  const subtitle = localized(
    fields.carSubtitleAr,
    fields.carSubtitleEn,
    fields.carSubtitleHe,
    model
  )

  return {
    slug,
    model,
    subtitle,
    bodyType: choice(fields.bodyType, BODY_TYPES, {
      ar: 'مركبة',
      en: 'Vehicle',
      he: 'רכב',
    }),
    origin: enumValue<CarOrigin>(fields.origin, carOrigins, 'germany'),
    status: enumValue<CarStatus>(fields.status, carStatuses, 'available'),
    stage: stage(fields.stage),
    year: int(fields.year, new Date().getFullYear()),
    mileage: int(fields.mileage, 0),
    // Null is meaningful: the detail page renders "on request" for it, so an
    // unpriced vehicle must not collapse to a misleading 0.
    price: nullableNumber(fields.price),
    featured: fields.featured ?? undefined,
    image: heroNode?.sourceUrl || PLACEHOLDER_IMAGE,
    alt: heroAlt ? plain(heroAlt) : subtitle,
    gallery: gallery(fields),
    description: localized(
      fields.descriptionAr,
      fields.descriptionEn,
      fields.descriptionHe,
      ''
    ),
    highlights: highlights(fields),
    specs: specs(fields),
    eta: localized(fields.etaAr, fields.etaEn, fields.etaHe, ''),
  }
}

/** The four import steps; anything outside 1–4 is meaningless. */
function stage(value: unknown): ImportCar['stage'] {
  const numeric = int(value, 1)
  if (numeric >= 1 && numeric <= 4) return numeric as ImportCar['stage']
  return 1
}
