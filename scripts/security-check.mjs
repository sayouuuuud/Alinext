#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const sourceCache = new Map()
const failures = []

function source(file) {
  if (!sourceCache.has(file)) {
    sourceCache.set(file, readFileSync(new URL(file, new URL('../', import.meta.url)), 'utf8'))
  }
  return sourceCache.get(file)
}

function occurrenceCount(value, pattern) {
  if (typeof pattern === 'string') return value.split(pattern).length - 1
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  return [...value.matchAll(new RegExp(pattern.source, flags))].length
}

function verify({ name, file, required = [], forbidden = [], minimum = [] }) {
  const value = source(file)

  for (const [description, pattern] of required) {
    const found = typeof pattern === 'string' ? value.includes(pattern) : pattern.test(value)
    if (pattern instanceof RegExp) pattern.lastIndex = 0
    if (!found) failures.push(`${name}: missing ${description} in ${file}`)
  }

  for (const [description, pattern] of forbidden) {
    const found = typeof pattern === 'string' ? value.includes(pattern) : pattern.test(value)
    if (pattern instanceof RegExp) pattern.lastIndex = 0
    if (found) failures.push(`${name}: found forbidden ${description} in ${file}`)
  }

  for (const [description, pattern, count] of minimum) {
    const actual = occurrenceCount(value, pattern)
    if (actual < count) {
      failures.push(`${name}: expected ${description} at least ${count} times in ${file}, found ${actual}`)
    }
  }
}

const controls = [
  {
    name: 'C3 chat endpoint fails closed',
    file: 'app/api/chat/route.ts',
    required: [
      ['404 response', 'status: 404'],
      ['GET denial', 'export const GET = notFound'],
      ['POST denial', 'export const POST = notFound'],
      ['OPTIONS denial', 'export const OPTIONS = notFound'],
      ['private no-store response', "'cache-control': 'private, no-store, max-age=0'"],
    ],
    forbidden: [
      ['AI generation call', /\b(?:streamText|generateText)\s*\(/],
      ['AI Gateway secret access', 'AI_GATEWAY_API_KEY'],
    ],
  },
  {
    name: 'C2 CMS route exposes only required methods',
    file: 'app/cms/[[...path]]/route.ts',
    required: [
      ['GET handler', 'export const GET = handler'],
      ['POST handler', 'export const POST = handler'],
      ['HEAD handler', 'export const HEAD = handler'],
    ],
    forbidden: [
      ['PUT handler', /export const PUT\b/],
      ['PATCH handler', /export const PATCH\b/],
      ['DELETE handler', /export const DELETE\b/],
    ],
  },
  {
    name: 'C2/H4 checkout proxy is allowlisted and bounded',
    file: 'lib/checkout/proxy.ts',
    required: [
      ['request body limit', 'const REQUEST_BODY_LIMIT_BYTES = 512 * 1024'],
      ['text response limit', 'const UPSTREAM_TEXT_LIMIT_BYTES = 3 * 1024 * 1024'],
      ['asset response limit', 'const UPSTREAM_ASSET_LIMIT_BYTES = 12 * 1024 * 1024'],
      ['checkout allowlist branch', 'const isCheckoutPath ='],
      ['static asset allowlist branch', 'const isStaticAsset ='],
      ['admin AJAX allowlist branch', 'const isAdminAjax ='],
      ['default-deny path handling', 'if (!allowedMethod) return notFoundResponse()'],
      ['same-origin write check', "if (method === 'POST' && !isTrustedWriteOrigin(request))"],
      ['incoming cookie allowlist', 'filterCheckoutCookies('],
      ['outgoing cookie allowlist', 'isAllowedSetCookie('],
      ['bounded stream reader', 'await readBodyWithLimit('],
    ],
    forbidden: [['unbounded request buffering', '.arrayBuffer()']],
    minimum: [['bounded stream reads', 'await readBodyWithLimit(', 4]],
  },
  {
    name: 'M1 image proxy validates source and response',
    file: 'app/api/img/route.ts',
    required: [
      ['10 MB cap', 'const MAX_IMAGE_BYTES = 10 * 1024 * 1024'],
      ['configured WordPress host', 'process.env.WORDPRESS_GRAPHQL_ENDPOINT'],
      ['HTTPS-only source', "target.protocol === 'https:'"],
      ['credential rejection', '!target.username'],
      ['port rejection', '!target.port'],
      ['uploads-only path', "decodedPath.startsWith('/wp-content/uploads/')"],
      ['image extension check', 'IMAGE_EXTENSION.test(decodedPath)'],
      ['redirect rejection', "redirect: 'error'"],
      ['response MIME allowlist', 'ALLOWED_IMAGE_TYPES.has(contentType)'],
      ['bounded response body', 'readBodyWithLimit('],
      ['nosniff response', "'X-Content-Type-Options': 'nosniff'"],
    ],
    forbidden: [['unbounded image buffering', '.arrayBuffer()']],
  },
  {
    name: 'M5 revalidation is POST-only and header-authenticated',
    file: 'app/api/revalidate/route.ts',
    required: [
      ['POST-only export', 'export async function POST('],
      ['fail-closed missing secret handling', 'if (!secret)'],
      ['secret header', "request.headers.get('x-alifleet-revalidate-secret')"],
      ['constant-time comparison', 'timingSafeEqual('],
      ['profiled cache invalidation', "revalidateTag(WP_CACHE_TAG, 'max')"],
    ],
    forbidden: [
      ['GET handler', /export (?:async )?function GET\b/],
      ['query-string secret', /searchParams\.get\(['"]secret['"]\)/],
    ],
  },
  {
    name: 'H1 baseline response headers are enforced',
    file: 'next.config.mjs',
    required: [
      ['enforcing CSP', "{ key: 'Content-Security-Policy', value: contentSecurityPolicy }"],
      ['frame denial', "{ key: 'X-Frame-Options', value: 'DENY' }"],
      ['MIME sniffing denial', "{ key: 'X-Content-Type-Options', value: 'nosniff' }"],
      ['HSTS', "{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }"],
      ['frame ancestor denial', '"frame-ancestors \'none\'"'],
      ['object denial', '"object-src \'none\'"'],
    ],
    forbidden: [['ignored TypeScript build errors', 'ignoreBuildErrors']],
  },
  {
    name: 'H2 WordPress HTML is allowlist-sanitized',
    file: 'lib/wp/sanitize-html.ts',
    required: [
      ['sanitize-html library', "import sanitizeHtml from 'sanitize-html'"],
      ['tag allowlist', 'allowedTags: ['],
      ['attribute allowlist', 'allowedAttributes: {'],
      ['protocol-relative URL denial', 'allowProtocolRelative: false'],
      ['script-like node removal', "nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript']"],
      ['URL transforms', 'transformTags: {'],
      ['sanitizer export', 'export function sanitizeWordPressHtml('],
    ],
  },
  {
    name: 'H2 blog content uses the sanitizer',
    file: 'lib/wp/posts.ts',
    required: [['content sanitization', 'post.content = sanitizeWordPressHtml(node.content)']],
  },
  {
    name: 'H2 policy content uses the sanitizer',
    file: 'lib/wp/policies.ts',
    required: [['content sanitization', '? sanitizeWordPressHtml(nestedValue)']],
  },
  {
    name: 'H4 stream reader enforces declared and actual sizes',
    file: 'lib/http-limits.ts',
    required: [
      ['declared length check', 'declaredLength > limit'],
      ['streamed length check', 'total > limit'],
      ['reader cancellation', 'await reader.cancel()'],
      ['typed limit error', 'throw new BodyLimitExceededError(limit)'],
    ],
  },
  {
    name: 'H5 environment files stay outside Git',
    file: '.gitignore',
    required: [
      ['base env ignore', '.env\n'],
      ['all env variants ignore', '.env.*'],
      ['example allowlist', '!.env.example'],
    ],
  },
  {
    name: 'C1 WordPress user enumeration is denied',
    file: 'wordpress/mu-plugin/alifleet-cms.php',
    required: [
      ['REST endpoint filter', "'rest_endpoints'"],
      ['REST user route match', "#^/wp/v2/users(?:/|$)#"],
      ['REST index filtering', "'rest_index'"],
      ['anonymous GraphQL visibility filter', "'graphql_object_visibility'"],
      ['GraphQL user model check', "'UserObject' === $model_name"],
      ['private GraphQL user visibility', "return 'private';"],
    ],
  },
  {
    name: 'C1 XML-RPC and pingbacks are disabled',
    file: 'wordpress/mu-plugin/alifleet-cms.php',
    required: [
      ['XML-RPC authentication denial', "add_filter( 'xmlrpc_enabled', '__return_false', PHP_INT_MAX )"],
      ['XML-RPC method removal', "add_filter( 'xmlrpc_methods', static fn ( array $methods ): array => [], PHP_INT_MAX )"],
      ['pingback denial', "add_filter( 'pings_open', '__return_false', PHP_INT_MAX )"],
      ['X-Pingback removal', "unset( $headers['X-Pingback'], $headers['x-pingback'] )"],
    ],
  },
  {
    name: 'C1/H3 WordPress authentication is throttled',
    file: 'wordpress/mu-plugin/alifleet-cms.php',
    required: [
      ['transient-backed counters', 'set_transient( $key, $state'],
      ['login pre-check', "'authenticate'"],
      ['failed-login increment', "'wp_login_failed'"],
      ['per-IP login bucket', "'login_ip', 40, ALIFLEET_LOGIN_WINDOW"],
      ['per-principal login bucket', "'login_principal', 8, ALIFLEET_LOGIN_WINDOW"],
      ['registration throttle', "'registration_errors'"],
      ['password-reset throttle', "'lostpassword_errors'"],
    ],
  },
  {
    name: 'H3 forwarded client IP is signed',
    file: 'wordpress/mu-plugin/alifleet-cms.php',
    required: [
      ['signed address header', "HTTP_X_ALIFLEET_CLIENT_IP"],
      ['timestamp freshness', 'abs( time() - (int) $timestamp ) <= 300'],
      ['HMAC verification', "hash_hmac( 'sha256', $address . '|' . $timestamp, $secret )"],
      ['constant-time signature verification', 'hash_equals( $expected, $signature )'],
      ['direct-request fallback', "$_SERVER['REMOTE_ADDR']"],
    ],
  },
  {
    name: 'H3 Next.js signs the forwarded client IP',
    file: 'lib/wp/request-security.ts',
    required: [
      ['IP validation', 'isIP(address)'],
      ['shared secret', 'wpRevalidateSecret()'],
      ['HMAC signing', "createHmac('sha256', secret)"],
      ['signed IP header', "'x-alifleet-client-ip': address"],
      ['timestamp header', "'x-alifleet-client-ip-timestamp': timestamp"],
      ['signature header', "'x-alifleet-client-ip-signature': signature"],
    ],
  },
  {
    name: 'M2 redirects remain same-origin',
    file: 'lib/auth/actions.ts',
    required: [
      ['control and backslash rejection', "/[\\\\\\u0000-\\u001f\\u007f\\u2028\\u2029]/"],
      ['multi-pass decoding', 'for (let pass = 0; pass < 3; pass += 1)'],
      ['scheme-relative rejection', "decoded.startsWith('//')"],
      ['origin equality check', 'resolved.origin !== base.origin'],
    ],
  },
  {
    name: 'M4 authentication cookies are secure outside local development',
    file: 'lib/auth/session.ts',
    required: [
      ['development-only localhost exception', "process.env.NODE_ENV === 'development'"],
      ['secure default', 'secure: !localDevelopment'],
      ['HttpOnly flag', 'httpOnly: true'],
      ['SameSite flag', "sameSite: 'lax' as const"],
    ],
  },
  {
    name: 'M4 checkout cookies resist protocol downgrades',
    file: 'lib/checkout/actions.ts',
    required: [
      ['validated host parser', 'function parseCheckoutHost('],
      ['validated protocol selector', 'function checkoutActionProtocol('],
      ['local-development-only HTTP', "forwardedProtocol === 'http' && isLocalDevelopmentHost(hostname)"],
      ['sanitized forwarded protocol', "'x-forwarded-proto': protocol"],
      ['secure cookie policy', 'function secureCheckoutCookie('],
    ],
    forbidden: [['raw URL protocol cookie flag', "secure: new URL(request.url).protocol === 'https:'"]],
    minimum: [['secure checkout cookie usage', 'secure: secureCheckoutCookie(request)', 2]],
  },
  {
    name: 'M6 production builds fail on errors',
    file: 'package.json',
    required: [
      ['direct Next.js build', '"build": "next build"'],
      ['security regression command', '"security:check": "node scripts/security-check.mjs"'],
    ],
    forbidden: [
      ['fallback build that hides failures', 'next build ||'],
      ['shell command that ignores failures', '|| true'],
    ],
  },
  {
    name: 'M7 session verification happens in the permission callback',
    file: 'wordpress/mu-plugin/alifleet-cms.php',
    required: [
      ['session route', "'/session'"],
      ['real permission callback', "'permission_callback' => static function ( WP_REST_Request $request )"],
      ['JWT user verification', 'alifleet_checkout_user_id( $request )'],
      ['verified user handoff', "$request->set_param( '_alifleet_verified_user_id', $user_id )"],
    ],
    forbidden: [['public permission callback', "'permission_callback' => '__return_true'"]],
  },
]

for (const control of controls) verify(control)

const authActions = source('lib/auth/actions.ts')
if (occurrenceCount(authActions, 'await wordpressSecurityHeaders()') < 3) {
  failures.push(
    'H3 authentication actions: login, registration, and password reset must all forward signed client-IP headers'
  )
}

if (failures.length > 0) {
  console.error('Security regression check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Security regression check passed: ${controls.length + 1} controls across ${sourceCache.size} files.`
)
