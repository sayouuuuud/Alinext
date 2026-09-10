import 'server-only'

import type { ImportCar } from '@/lib/data/import-cars'
import { carToImport } from './adapters'
import { getSiteContent } from './repository'

export type VehiclesStatus = 'ok' | 'empty'
export type VehicleInventory = { cars: ImportCar[]; status: VehiclesStatus }

export async function getVehicles(): Promise<VehicleInventory> {
  const content = await getSiteContent()
  const cars = content.cars.filter((car) => car.type === 'import').map(carToImport)
  return { cars, status: cars.length ? 'ok' : 'empty' }
}

export async function getVehicle(slug: string): Promise<ImportCar | null> {
  const content = await getSiteContent()
  const car = content.cars.find((item) => item.id === slug && item.type === 'import')
  return car ? carToImport(car) : null
}

export async function getSimilarVehicles(car: ImportCar, limit = 3): Promise<ImportCar[]> {
  const { cars } = await getVehicles()
  const others = cars.filter((item) => item.slug !== car.slug)
  return [
    ...others.filter((item) => item.bodyType.en === car.bodyType.en),
    ...others.filter((item) => item.bodyType.en !== car.bodyType.en),
  ].slice(0, limit)
}
