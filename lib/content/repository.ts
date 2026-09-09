import 'server-only'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaultSiteContent } from '@/lib/admin/default-content'
import type { SiteFullContent } from '@/lib/admin/types'

const contentFile = join(process.cwd(), 'data', 'site-content.json')

function isSiteContent(value: unknown): value is SiteFullContent {
  if (!value || typeof value !== 'object') return false
  const content = value as Partial<SiteFullContent>
  return Boolean(
    content.pages?.home &&
      Array.isArray(content.cars) &&
      Array.isArray(content.products) &&
      Array.isArray(content.blog)
  )
}

export function getSiteContent(): SiteFullContent {
  try {
    const parsed = JSON.parse(readFileSync(contentFile, 'utf8')) as unknown
    return isSiteContent(parsed) ? parsed : defaultSiteContent
  } catch {
    return defaultSiteContent
  }
}
