import { type NextRequest, NextResponse } from 'next/server'

import { BodyLimitExceededError, readBodyWithLimit } from '@/lib/http-limits'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|webp)$/i

function invalidRequest(message: string) {
  return new NextResponse(message, {
    status: 400,
    headers: { 'cache-control': 'private, no-store, max-age=0' },
  })
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')
  if (!raw) return invalidRequest('Missing url param')

  let target: URL
  let allowedHost = ''
  try {
    target = new URL(raw)
    allowedHost = new URL(process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? '').hostname.toLowerCase()
  } catch {
    return invalidRequest('Invalid url')
  }

  let decodedPath = ''
  try {
    decodedPath = decodeURIComponent(target.pathname)
  } catch {
    return invalidRequest('Invalid path')
  }

  const validTarget =
    Boolean(allowedHost) &&
    target.protocol === 'https:' &&
    !target.username &&
    !target.password &&
    !target.port &&
    target.hostname.toLowerCase() === allowedHost &&
    decodedPath.startsWith('/wp-content/uploads/') &&
    !decodedPath.includes('\\') &&
    !decodedPath.includes('\0') &&
    IMAGE_EXTENSION.test(decodedPath)

  if (!validTarget) return invalidRequest('Forbidden image source')

  try {
    const upstream = await fetch(target, {
      headers: {
        Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif',
        'User-Agent': 'AliFleet-NextJS-Image-Proxy/2.0',
      },
      redirect: 'error',
      next: { revalidate: 86400 },
    })

    if (!upstream.ok) return new NextResponse('Image unavailable', { status: 502 })

    const contentType = (upstream.headers.get('content-type') ?? '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase()
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return new NextResponse('Invalid image response', { status: 502 })
    }

    const body = await readBodyWithLimit(
      upstream.body,
      upstream.headers.get('content-length'),
      MAX_IMAGE_BYTES
    )

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Length': String(body.byteLength),
        'Cross-Origin-Resource-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof BodyLimitExceededError) {
      return new NextResponse('Image too large', { status: 502 })
    }
    console.error('[img-proxy] upstream request failed')
    return new NextResponse('Image unavailable', { status: 502 })
  }
}
