/**
 * Google Search Console site verification.
 *
 * Search Console asks for a file at `/google<token>.html`, but the App Router
 * does not serve `.html` files placed in `public/` — the request falls through
 * to the not-found page. Serving the exact body from a route handler satisfies
 * the check and keeps the token in version control.
 *
 * Do not rename or delete this route: Google re-checks it periodically and
 * removing it drops the property's verified status.
 */
export const dynamic = 'force-static'

const VERIFICATION_BODY = 'google-site-verification: google41b36aad945e5f8f.html'

export function GET() {
  return new Response(VERIFICATION_BODY, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
