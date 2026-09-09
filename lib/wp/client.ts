import 'server-only'

import { BodyLimitExceededError, decodeUtf8, readBodyWithLimit } from '@/lib/http-limits'
import { WP_CACHE_TAG, isWpConfigured, wpEndpoint } from './config'
import { WpError, classifyWpErrors } from './errors'
import type { WordPressSecurityHeaders } from './request-security'

const MAX_GRAPHQL_REQUEST_BYTES = 256 * 1024
const MAX_GRAPHQL_RESPONSE_BYTES = 3 * 1024 * 1024
const SECURITY_HEADER_NAMES = new Set([
  'x-alifleet-client-ip',
  'x-alifleet-client-ip-timestamp',
  'x-alifleet-client-ip-signature',
])

type GraphQLResponse<T> = {
  data?: T | null
  errors?: {
    message: string
    extensions?: { category?: string; code?: string }
  }[]
}

/**
 * Single low-level entry point for every WordPress call.
 *
 * Runs server-side only: the JWT never reaches the browser, so it is read from
 * an httpOnly cookie by the caller and injected here as an Authorization
 * header. Never import this from a client component.
 */
export async function wpFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: {
    authToken?: string | null
    revalidate?: number
    securityHeaders?: WordPressSecurityHeaders
  } = {}
): Promise<T> {
  if (!isWpConfigured()) {
    throw new WpError('not_configured', ['WORDPRESS_GRAPHQL_ENDPOINT is not set'])
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`
  }
  for (const [name, value] of Object.entries(options.securityHeaders ?? {})) {
    if (value && SECURITY_HEADER_NAMES.has(name)) headers[name] = value
  }

  const requestBody = JSON.stringify({ query, variables })
  if (new TextEncoder().encode(requestBody).byteLength > MAX_GRAPHQL_REQUEST_BYTES) {
    throw new WpError('unknown', ['GraphQL request exceeded the size limit'])
  }

  // Account data is per-user and must never be shared between visitors, so it
  // stays uncached. Public catalog data opts in to the Next.js data cache by
  // passing `revalidate`, which keeps a 165-product storefront off the
  // WordPress box on every single request.
  //
  // Every cached read is tagged here rather than at the call sites so that a
  // new cached query cannot be added without a purge path — forgetting the tag
  // would strand that query on its full revalidate window with no way to
  // flush it, and the omission would be invisible until an editor complained.
  const caching: Pick<RequestInit, 'cache'> & {
    next?: { revalidate: number; tags: string[] }
  } =
    typeof options.revalidate === 'number'
      ? { next: { revalidate: options.revalidate, tags: [WP_CACHE_TAG] } }
      : { cache: 'no-store' }

  let response: Response
  try {
    response = await fetch(wpEndpoint, {
      method: 'POST',
      headers,
      body: requestBody,
      ...caching,
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    console.warn('[AliFleet] WordPress request failed.', { errorName })
    throw new WpError('network', ['WordPress request failed'])
  }

  let raw: string
  try {
    raw = decodeUtf8(
      await readBodyWithLimit(
        response.body,
        response.headers.get('content-length'),
        MAX_GRAPHQL_RESPONSE_BYTES
      )
    )
  } catch (error) {
    if (error instanceof BodyLimitExceededError) {
      console.error('[AliFleet] WordPress response exceeded the size limit.', {
        status: response.status,
      })
    }
    throw new WpError('network', ['WordPress returned an invalid response'])
  }

  let payload: GraphQLResponse<T>
  try {
    payload = JSON.parse(raw) as GraphQLResponse<T>
  } catch {
    console.error('[AliFleet] WordPress returned a non-JSON response.', {
      status: response.status,
      contentType: response.headers.get('content-type') ?? 'unknown',
    })
    throw new WpError('network', [
      `HTTP ${response.status} returned a non-JSON body`,
    ])
  }

  if (payload.errors?.length) {
    const messages = payload.errors.map((error) => error.message)
    const codes = payload.errors
      .map((error) => error.extensions?.code ?? '')
      .filter(Boolean)
    console.warn('[AliFleet] WordPress GraphQL request returned errors.', {
      count: payload.errors.length,
      codes,
    })
    throw new WpError(classifyWpErrors([...messages, ...codes]), messages)
  }

  if (!response.ok) {
    throw new WpError('network', [`HTTP ${response.status}`])
  }

  if (!payload.data) {
    throw new WpError('unknown', ['GraphQL response contained no data'])
  }

  return payload.data
}
