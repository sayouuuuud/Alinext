import 'server-only'

import type { SaleCar } from '@/lib/data/sale-cars'
import { carToSale } from './adapters'
import { getSiteContent } from './repository'

export type SaleCarsStatus = 'ok' | 'empty'
export type SaleInventory = { cars: SaleCar[]; status: SaleCarsStatus }

export async function getSaleCars(): Promise<SaleInventory> {
  const cars = getSiteContent().cars
    .filter((car) => car.type === 'sale')
    .map(carToSale)
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
  return { cars, status: cars.length ? 'ok' : 'empty' }
}

export async function getSaleCar(slug: string): Promise<SaleCar | null> {
  const car = getSiteContent().cars.find(
    (item) => item.id === slug && item.type === 'sale'
  )
  return car ? carToSale(car) : null
}

export async function getSimilarSaleCars(
  car: SaleCar,
  limit = 3
): Promise<SaleCar[]> {
  const { cars } = await getSaleCars()
  const others = cars.filter((item) => item.slug !== car.slug)
  return [
    ...others.filter((item) => item.bodyType.en === car.bodyType.en),
    ...others.filter((item) => item.bodyType.en !== car.bodyType.en),
  ].slice(0, limit)
}
