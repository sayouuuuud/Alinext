import { NextRequest, NextResponse } from 'next/server'
import { copyResponseCookies, updateSession } from '@/lib/supabase/proxy'
import { LOCALE_HEADER, LOCALE_STORAGE_KEY, defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { localePrefixedPrivatePathname, normalizePathname, resolvePublicPathname } from '@/lib/i18n/routing'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function withLocaleCookie(response: NextResponse, request: NextRequest, locale: Locale) {
  if (request.cookies.get(LOCALE_STORAGE_KEY)?.value !== locale) {
    response.cookies.set(LOCALE_STORAGE_KEY, locale, {
      path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:',
    })
  }
  return response
}

function requestHeaders(request: NextRequest, locale: Locale) {
  const headers = new Headers(request.headers)
  headers.set(LOCALE_HEADER, locale)
  return headers
}

function finish(response: NextResponse, authResponse: NextResponse) {
  return copyResponseCookies(authResponse, response)
}

function localeRedirect(request: NextRequest, pathname: string, locale: Locale, authResponse: NextResponse, removeLocaleQuery = true) {
  const destination = request.nextUrl.clone()
  destination.pathname = pathname
  if (removeLocaleQuery) destination.searchParams.delete('locale')
  return finish(withLocaleCookie(NextResponse.redirect(destination, { status: 308 }), request, locale), authResponse)
}

export async function proxy(request: NextRequest) {
  const authResponse = await updateSession(request)
  const { pathname, searchParams } = request.nextUrl
  if (pathname.startsWith('/api/')) return authResponse

  const requestedLocale = searchParams.get('locale')
  const publicRoute = resolvePublicPathname(pathname, requestedLocale)

  if (publicRoute) {
    const mustRedirect = normalizePathname(pathname) !== normalizePathname(publicRoute.canonicalPathname) || isLocale(requestedLocale)
    if (mustRedirect) return localeRedirect(request, publicRoute.canonicalPathname, publicRoute.locale, authResponse)

    const headers = requestHeaders(request, publicRoute.locale)
    const response = publicRoute.internalPathname === pathname
      ? NextResponse.next({ request: { headers } })
      : NextResponse.rewrite(new URL(`${publicRoute.internalPathname}${request.nextUrl.search}`, request.url), { request: { headers } })
    return finish(withLocaleCookie(response, request, publicRoute.locale), authResponse)
  }

  const prefixedPrivate = localePrefixedPrivatePathname(pathname)
  if (prefixedPrivate) return localeRedirect(request, prefixedPrivate.pathname, prefixedPrivate.locale, authResponse)

  const cookieLocale = request.cookies.get(LOCALE_STORAGE_KEY)?.value
  const locale = isLocale(requestedLocale) ? requestedLocale : isLocale(cookieLocale) ? cookieLocale : defaultLocale
  if (isLocale(requestedLocale)) return localeRedirect(request, pathname, locale, authResponse)

  const response = NextResponse.next({ request: { headers: requestHeaders(request, locale) } })
  return finish(withLocaleCookie(response, request, locale), authResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico$|icon.png$|apple-icon.png$|robots.txt$|sitemap.xml$|.*\\.[a-zA-Z0-9]+$).*)'],
}
