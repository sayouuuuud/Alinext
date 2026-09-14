import 'server-only'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createAdminClient } from '@/lib/supabase/server'

/** Public URL prefix for locally stored uploads (served from public/). */
export const LOCAL_UPLOAD_PREFIX = '/uploads/'

const LEGACY_BUCKET = 'alifleet-media'

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
])

const VIDEO_MIMES = new Set(['video/mp4', 'video/webm'])

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export class LocalMediaError extends Error {
  constructor(public code: 'unsupported_file_type' | 'file_too_large' | 'storage_failed') {
    super(code)
  }
}

function uploadRoot(): string {
  const configured = (process.env.LOCAL_UPLOAD_DIR || '').trim()
  if (configured) return path.resolve(configured)
  return path.join(process.cwd(), 'public', 'uploads')
}

function extFor(mimeType: string): string {
  const sub = mimeType.split('/')[1] || 'bin'
  if (sub === 'jpeg') return 'jpg'
  if (sub === 'svg+xml') return 'svg'
  return sub.replace(/[^a-z0-9]/g, '') || 'bin'
}

export type SaveUploadInput = {
  buffer: Buffer
  mimeType: string
  folder?: string
  originalName?: string
}

function safeFolder(folder: string | undefined): string {
  const clean = (folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'uploads'
  return clean
}

/**
 * Stores an uploaded file on the server's local disk under public/uploads
 * and returns its public URL path (e.g. /uploads/products/169...-x.jpg).
 */
export async function saveLocalUpload(input: SaveUploadInput): Promise<string> {
  const mimeType = (input.mimeType || '').split(';')[0].trim().toLowerCase()
  const isImage = IMAGE_MIMES.has(mimeType)
  const isVideo = VIDEO_MIMES.has(mimeType)
  if (!isImage && !isVideo) throw new LocalMediaError('unsupported_file_type')
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (!input.buffer?.length || input.buffer.byteLength > limit) throw new LocalMediaError('file_too_large')

  const folder = safeFolder(input.folder)
  const safeName = (input.originalName || 'upload').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30) || 'upload'
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}.${extFor(mimeType)}`
  const dir = path.join(uploadRoot(), folder)
  await mkdir(dir, { recursive: true })
  const { writeFile } = await import('node:fs/promises')
  try {
    await writeFile(path.join(dir, fileName), input.buffer)
  } catch {
    throw new LocalMediaError('storage_failed')
  }
  return `${LOCAL_UPLOAD_PREFIX}${folder}/${fileName}`
}

function localPathFor(url: string): string | null {
  if (!url.startsWith(LOCAL_UPLOAD_PREFIX)) return null
  const relative = url.slice(LOCAL_UPLOAD_PREFIX.length)
  if (!relative || relative.includes('..') || path.isAbsolute(relative)) return null
  const resolved = path.resolve(uploadRoot(), relative)
  if (!resolved.startsWith(path.resolve(uploadRoot()) + path.sep)) return null
  return resolved
}

async function deleteLocalPath(resolved: string): Promise<void> {
  try {
    await unlink(resolved)
  } catch (error) {
    // Already gone or unreachable: never fail the calling operation.
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') console.error('Local media delete failed:', resolved)
  }
}

function legacySupabasePath(url: string): string | null {
  const marker = `${LEGACY_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  const objectPath = url.slice(index + marker.length).split('?')[0]
  if (!objectPath || objectPath.includes('..')) return null
  return objectPath
}

/**
 * Removes a media file previously stored by saveLocalUpload (or, on a
 * best-effort basis, a legacy Supabase alifleet-media object). External URLs
 * and bundled placeholders are ignored. Never throws.
 */
export async function deleteMediaUrl(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== 'string') return
  const trimmed = url.trim()
  if (!trimmed) return
  const local = localPathFor(trimmed)
  if (local) {
    await deleteLocalPath(local)
    return
  }
  const legacy = legacySupabasePath(trimmed)
  if (legacy) {
    try {
      await createAdminClient().storage.from(LEGACY_BUCKET).remove([legacy])
    } catch (error) {
      console.error('Legacy Supabase media delete failed:', legacy, error)
    }
  }
}

/** De-dupes a list of media URLs, dropping blanks. */
export function uniqueMediaUrls(urls: Array<string | null | undefined>): string[] {
  return [...new Set(urls.map((url) => (typeof url === 'string' ? url.trim() : '')).filter(Boolean))]
}

/** True when the URL points at this server's local upload folder. */
export function isLocalMediaUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith(LOCAL_UPLOAD_PREFIX)
}

/**
 * Resolves request path segments (e.g. from /uploads/a/b.jpg) to an absolute
 * file inside the upload root. Returns null for anything suspicious.
 */
export function resolveUploadFile(segments: string[]): string | null {
  if (!segments.length || segments.length > 4) return null
  for (const segment of segments) {
    if (!segment || segment === '.' || segment === '..') return null
    if (!/^[a-zA-Z0-9_.-]+$/.test(segment)) return null
  }
  const fileName = segments[segments.length - 1]
  if (!fileName.includes('.')) return null
  const ext = fileName.split('.').pop()!.toLowerCase()
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'mp4', 'webm'])
  if (!allowed.has(ext)) return null
  const root = path.resolve(uploadRoot())
  const resolved = path.resolve(root, ...segments)
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null
  return resolved
}

/** Writable temp dir for tests/diagnostics (never the upload folder). */
export function mediaTempDir(): string {
  return tmpdir()
}
