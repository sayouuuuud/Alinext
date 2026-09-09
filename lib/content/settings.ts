import 'server-only'

import { contentToStoreSettings, type StoreSettings } from '@/lib/site-config'
import type { Locale } from '@/lib/i18n/config'
import { getSiteContent } from './repository'

export async function getStoreSettings(locale?: Locale): Promise<StoreSettings> {
  return contentToStoreSettings(getSiteContent(), locale)
}
