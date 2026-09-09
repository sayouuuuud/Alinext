import 'server-only'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaultSiteContent } from '@/lib/admin/default-content'
import type { SiteFullContent } from '@/lib/admin/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'

const contentFile = join(process.cwd(), 'data', 'site-content.json')

/**
 * Content data source.
 *
 * Today everything is served from the file-backed store
 * (`data/site-content.json`), which the admin panel writes through
 * `/api/admin/content`. When Supabase is activated (env vars present +
 * `supabase/schema.sql` applied), `getContentSource()` flips to `'supabase'`
 * and this is the single seam where the async Supabase-backed read replaces
 * the file read — no call sites need to change.
 */
export type ContentSource = 'file' | 'supabase'

export function getContentSource(): ContentSource {
  return isSupabaseConfigured() ? 'supabase' : 'file'
}

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

function readFileContent(): SiteFullContent {
  try {
    const parsed = JSON.parse(readFileSync(contentFile, 'utf8')) as unknown
    return isSiteContent(parsed) ? parsed : defaultSiteContent
  } catch {
    return defaultSiteContent
  }
}

export function getSiteContent(): SiteFullContent {
  // NOTE: Supabase reads are async; when activating, convert this to an async
  // function that awaits the Supabase source and update callers accordingly.
  // Until then the file source is always used.
  return readFileContent()
}
