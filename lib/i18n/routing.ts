import {
  defaultLocale,
  isLocale,
  type Locale,
} from './config'

const PRIVATE_ROUTE_ROOTS = new Set([
  'account',
  'admin',
  'api',
  'cart',
  'my-account',
  'track-order',
])

const LEGACY_ROUTE_ALIASES: Record<string, string> = {
  about: '/',
  'car-import': '/cars',
  import: '/cars',
  'personal-import': '/cars',
  privacy: '/privacy-policy',
  'refund-and-returns': '/return-policy',
  'refund-returns': '/return-policy',
  refund_returns: '/return-policy',
  shop: '/products',
  'terms-and-conditions': '/terms',
  'terms-conditions': '/terms',
}

export type PublicRoute = {
  locale: Locale
  internalPathname: string
  canonicalPathname: string
}

export function normalizePathname(pathname: string): string {
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/')
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : '/'
}

function segments(pathname: string): string[] {
  return normalizePathname(pathname).split('/').filter(Boolean)
}

export function isIndexedPathname(pathname: string): boolean {
  const parts = segments(pathname)
  if (parts.length === 0) return true
  if (parts.length === 1) {
    return [
      'blog',
      'cars',
      'contact',
      'privacy-policy',
      'products',
      'return-policy',
      'terms',
    ].includes(parts[0])
  }
  if (parts.length === 2) {
    return (parts[0] === 'blog' || parts[0] === 'products') && Boolean(parts[1])
  }
  return (
    parts.length === 3 &&
    parts[0] === 'cars' &&
    (parts[1] === 'import' || parts[1] === 'sale') &&
    Boolean(parts[2])
  )
}

export function isPrivatePathname(pathname: string): boolean {
  const [root] = segments(pathname)
  return Boolean(root && PRIVATE_ROUTE_ROOTS.has(root))
}

export function toPublicPathname(
  internalPathname: string,
  locale: Locale
): string {
  const normalized = normalizePathname(internalPathname)
  if (!isIndexedPathname(normalized)) return normalized
  if (locale === defaultLocale) {
    return normalized === '/' ? '/' : `${normalized}/`
  }

  const localizedSegments = segments(normalized).map(
    (segment) => `${segment}-${locale}`
  )
  const localizedPath =
    localizedSegments.length === 0
      ? `home-${locale}`
      : localizedSegments.join('/')

  return `/${locale}/${localizedPath}/`
}

export function parsePublicPathname(pathname: string): PublicRoute | null {
  const normalized = normalizePathname(pathname)
  const parts = segments(normalized)
  const prefixedLocale = parts[0]

  if (prefixedLocale === 'en' || prefixedLocale === 'ar') {
    const locale = prefixedLocale
    const localized = parts.slice(1)
    let internalPathname: string

    if (
      localized.length === 1 &&
      localized[0] === `home-${locale}`
    ) {
      internalPathname = '/'
    } else {
      const suffix = `-${locale}`
      if (
        localized.length === 0 ||
        localized.some((segment) => !segment.endsWith(suffix))
      ) {
        return null
      }
      internalPathname = `/${localized
        .map((segment) => segment.slice(0, -suffix.length))
        .join('/')}`
    }

    if (!isIndexedPathname(internalPathname)) return null
    return {
      locale,
      internalPathname,
      canonicalPathname: toPublicPathname(internalPathname, locale),
    }
  }

  if (!isIndexedPathname(normalized)) return null
  return {
    locale: defaultLocale,
    internalPathname: normalized,
    canonicalPathname: toPublicPathname(normalized, defaultLocale),
  }
}

function localeFromSuffix(parts: string[]): Locale | null {
  for (const locale of ['ar', 'en', 'he'] as const) {
    if (parts.some((segment) => segment.endsWith(`-${locale}`))) {
      return locale
    }
  }
  return null
}

function mapLegacyInternalPath(parts: string[]): string {
  if (parts.length === 0 || parts[0] === 'home') return '/'

  if (parts[0] === 'product' && parts[1]) {
    return `/products/${parts.slice(1).join('/')}`
  }
  if (parts[0] === 'import' && parts[1]) {
    return `/cars/import/${parts.slice(1).join('/')}`
  }

  const alias = LEGACY_ROUTE_ALIASES[parts.join('/')]
  return alias ?? `/${parts.join('/')}`
}

export function resolvePublicPathname(
  pathname: string,
  requestedLocale?: string | null
): PublicRoute | null {
  const requested = isLocale(requestedLocale) ? requestedLocale : null
  const parsed = parsePublicPathname(pathname)
  if (parsed) {
    const locale = requested ?? parsed.locale
    return {
      locale,
      internalPathname: parsed.internalPathname,
      canonicalPathname: toPublicPathname(parsed.internalPathname, locale),
    }
  }

  const parts = segments(pathname)
  const firstSegment = parts[0]
  const prefix: Locale | null = isLocale(firstSegment) ? firstSegment : null
  if (prefix) parts.shift()
  const locale = requested ?? prefix ?? localeFromSuffix(parts) ?? defaultLocale
  const suffix = `-${locale}`
  const unsuffixed = parts.map((segment) =>
    segment.endsWith(suffix) ? segment.slice(0, -suffix.length) : segment
  )
  const internalPathname = mapLegacyInternalPath(unsuffixed)

  if (!isIndexedPathname(internalPathname)) return null
  return {
    locale,
    internalPathname,
    canonicalPathname: toPublicPathname(internalPathname, locale),
  }
}

export function localePrefixedPrivatePathname(
  pathname: string
): { locale: Locale; pathname: string } | null {
  const parts = segments(pathname)
  const locale = parts[0]
  if (!isLocale(locale)) return null
  parts.shift()
  const internalPathname = `/${parts.join('/')}`
  if (!isPrivatePathname(internalPathname)) return null
  return { locale, pathname: normalizePathname(internalPathname) }
}

export function toInternalPathname(pathname: string): string {
  return parsePublicPathname(pathname)?.internalPathname ?? normalizePathname(pathname)
}

export function localizeHref(href: string, locale: Locale): string {
  if (
    !href.startsWith('/') ||
    href.startsWith('//') ||
    /^(?:data|mailto|tel|javascript|blob):/i.test(href)
  ) {
    return href
  }

  const hashIndex = href.indexOf('#')
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : ''
  const queryIndex = beforeHash.indexOf('?')
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex) : ''
  const normalized = normalizePathname(pathname)
  const internalPathname = isIndexedPathname(normalized)
    ? normalized
    : parsePublicPathname(normalized)?.internalPathname

  if (!internalPathname) return href
  return `${toPublicPathname(internalPathname, locale)}${search}${hash}`
}
