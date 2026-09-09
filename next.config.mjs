import dns from 'node:dns'

try {
  dns.setDefaultResultOrder('ipv4first')
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4'])

  const { Resolver } = dns
  const fallbackResolver = new Resolver()
  fallbackResolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4'])

  const origLookup = dns.lookup
  dns.lookup = function (hostname, options, callback) {
    let cb = callback
    let opts = options
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    } else if (typeof opts === 'number') {
      opts = { family: opts }
    } else if (!opts) {
      opts = {}
    }

    origLookup.call(dns, hostname, opts, (err, address, family) => {
      if (err) {
        fallbackResolver.resolve4(hostname, (rErr, addresses) => {
          if (rErr || !addresses || addresses.length === 0) {
            return cb(err)
          }
          if (opts.all) {
            return cb(null, addresses.map((addr) => ({ address: addr, family: 4 })))
          }
          return cb(null, addresses[0], 4)
        })
      } else {
        return cb(null, address, family)
      }
    })
  }
} catch {}

/** @type {import('next').NextConfig} */

const privateNoStoreHeaders = [
  { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
]

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://connect.facebook.net https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://connect.facebook.net https://www.facebook.com https://api.stripe.com https://www.paypal.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
  "worker-src 'self' blob:",
  "media-src 'self' https:",
  'upgrade-insecure-requests',
].join('; ')

const nextConfig = {
  // Canonical public paths end in a slash, while private and proxy routes keep
  // their existing shape. The locale proxy owns that distinction.
  skipTrailingSlashRedirect: true,
  images: {
    // Optimization is ON: WordPress images arrive through the same-origin
    // proxy and are resized and served as AVIF/WebP instead of raw originals.
    formats: ['image/avif', 'image/webp'],
    // Next.js 16 rejects any quality that is not declared here.
    qualities: [70, 75, 80, 82],
    // HTTP image URLs are served through the same-origin proxy. Declaring
    // `localPatterns` at all opts every other local path out of optimization,
    // so the bundled artwork under /images has to be listed too — without it
    // Next.js answered the footer logo with `"url" parameter is not allowed`
    // and the logo rendered broken (QA-07).
    localPatterns: [
      { pathname: '/api/img' },
      { pathname: '/images/**' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'a-f.site' },
      { protocol: 'http', hostname: 'a-f.site' },
      { protocol: 'https', hostname: '*.sslip.io' },
      { protocol: 'http', hostname: '*.sslip.io' },
    ],
    minimumCacheTTL: 604800,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      { source: '/checkout/:path*', headers: privateNoStoreHeaders },
      { source: '/wc-ajax', headers: privateNoStoreHeaders },
      { source: '/account/:path*', headers: privateNoStoreHeaders },
      { source: '/my-account', headers: privateNoStoreHeaders },
    ]
  },
}

export default nextConfig
