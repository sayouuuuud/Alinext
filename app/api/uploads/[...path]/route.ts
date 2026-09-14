import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'

import { resolveUploadFile } from '@/lib/media/local-storage'

export const dynamic = 'force-dynamic'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

/**
 * Serves locally stored uploads straight from disk on every request.
 * (Next.js snapshots public/ at boot, so files uploaded at runtime would
 * otherwise 404 until the next restart. next.config rewrites /uploads/*
 * here.)
 */
export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params
  const resolved = resolveUploadFile(segments || [])
  if (!resolved) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  let buffer: Buffer
  try {
    buffer = await readFile(resolved)
  } catch {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (!buffer.length || buffer.byteLength > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const ext = resolved.split('.').pop()!.toLowerCase()
  // Filenames are unique per upload, so immutable caching is safe.
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
