import 'server-only'

import { cookies, headers } from 'next/headers'
import {
  LOCALE_HEADER,
  LOCALE_STORAGE_KEY,
  defaultLocale,
  isLocale,
  type Locale,
} from './config'

export async function getRequestLocale(): Promise<Locale> {
  const requestLocale = (await headers()).get(LOCALE_HEADER)
  if (isLocale(requestLocale)) return requestLocale

  const storedLocale = (await cookies()).get(LOCALE_STORAGE_KEY)?.value
  return isLocale(storedLocale) ? storedLocale : defaultLocale
}
