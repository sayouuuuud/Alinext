import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { deleteMediaUrl, uniqueMediaUrls } from '@/lib/media/local-storage'

type AdminClient = ReturnType<typeof createAdminClient>

export type MediaExclusion =
  | { table: 'cars'; id: string }
  | { table: 'products'; id: string }
  | { table: 'categories'; id: string }
  | { table: 'blog_posts'; id: string }

/**
 * Returns the subset of candidate URLs still referenced anywhere in content
 * tables (optionally excluding one entity being deleted/archived).
 */
export async function referencedMediaUrls(
  admin: AdminClient,
  candidates: string[],
  exclude?: MediaExclusion,
): Promise<Set<string>> {
  const list = uniqueMediaUrls(candidates)
  if (!list.length) return new Set()
  const used = new Set<string>()
  const collect = (rows: Array<Record<string, unknown>> | null, keys: string[]) => {
    for (const row of rows || []) {
      for (const key of keys) {
        const value = row[key]
        if (typeof value === 'string' && list.includes(value)) used.add(value)
      }
    }
  }

  const queries: Array<Promise<unknown>> = []
  const push = (
    table: 'cars' | 'products' | 'categories' | 'blog_posts' | 'car_media' | 'product_media',
    columns: string,
    notId?: { column: string; value: string },
    prefilterColumn?: string,
  ) => {
    const cols = columns.split(',').map((column) => column.trim())
    let query = admin.from(table).select(columns)
    // Narrow large tables by one indexed column; small tables scan fully so
    // multi-column matches (e.g. blog author_avatar) are never missed.
    if (prefilterColumn) query = query.in(prefilterColumn, list)
    if (notId) query = query.neq(notId.column, notId.value)
    queries.push(
      (async () => {
        const { data } = (await query) as { data: Array<Record<string, unknown>> | null }
        collect(data, cols)
      })(),
    )
  }

  push('cars', 'primary_image', exclude?.table === 'cars' ? { column: 'id', value: exclude.id } : undefined, 'primary_image')
  push('car_media', 'url', exclude?.table === 'cars' ? { column: 'car_id', value: exclude.id } : undefined, 'url')
  push('products', 'primary_image', exclude?.table === 'products' ? { column: 'id', value: exclude.id } : undefined, 'primary_image')
  push('product_media', 'url', exclude?.table === 'products' ? { column: 'product_id', value: exclude.id } : undefined, 'url')
  push('categories', 'image', exclude?.table === 'categories' ? { column: 'id', value: exclude.id } : undefined)
  push(
    'blog_posts',
    'cover_image,author_avatar,image',
    exclude?.table === 'blog_posts' ? { column: 'id', value: exclude.id } : undefined,
  )

  await Promise.all(queries)
  return used
}

/**
 * Deletes candidate media files that are no longer referenced anywhere.
 * Never throws: storage cleanup must not fail the calling admin operation.
 */
export async function pruneMediaUrls(
  admin: AdminClient,
  candidates: Array<string | null | undefined>,
  exclude?: MediaExclusion,
): Promise<{ removed: number; kept: number }> {
  try {
    const list = uniqueMediaUrls(candidates)
    if (!list.length) return { removed: 0, kept: 0 }
    const used = await referencedMediaUrls(admin, list, exclude)
    const orphaned = list.filter((url) => !used.has(url))
    await Promise.all(orphaned.map((url) => deleteMediaUrl(url)))
    return { removed: orphaned.length, kept: list.length - orphaned.length }
  } catch (error) {
    console.error('Media prune failed:', error)
    return { removed: 0, kept: 0 }
  }
}
