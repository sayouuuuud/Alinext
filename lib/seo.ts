/**
 * Canonical site URL helpers.
 *
 * Every SEO surface (sitemap, robots, canonical tags, Open Graph) needs the
 * public origin as an absolute URL. Deployments set NEXT_PUBLIC_SITE_URL; the
 * literal fallback keeps builds deterministic when the variable is missing so
 * a forgotten env var degrades to the right domain instead of localhost.
 */
const DEFAULT_SITE_URL = 'https://alifleet.com'

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return DEFAULT_SITE_URL
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, '')
}

/** Joins a path onto the canonical origin, guaranteeing a single slash. */
export function absoluteUrl(path = '/'): string {
  return `${siteUrl()}/${path.replace(/^\/+/, '')}`.replace(/\/$/, '') || siteUrl()
}
