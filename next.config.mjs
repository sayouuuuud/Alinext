/** @type {import('next').NextConfig} */

const privateNoStoreHeaders = [
  { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
]

const supabaseConnectSources = (() => {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    return `${url.origin} wss://${url.host}`
  } catch {
    return ''
  }
})()

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseConnectSources} https://connect.facebook.net https://www.facebook.com`,
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self' https:",
  'upgrade-insecure-requests',
].join('; ')

const nextConfig = {
  // Canonical public paths end in a slash, while private routes keep their
  // existing shape. The locale proxy owns that distinction.
  skipTrailingSlashRedirect: true,
  images: {
    // Optimization is ON: local imagery is resized and served as AVIF/WebP
    // instead of raw originals.
    formats: ['image/avif', 'image/webp'],
    // Next.js 16 rejects any quality that is not declared here.
    qualities: [70, 75, 80, 82],
    // Declaring `localPatterns` at all opts every other local path out of
    // optimization, so the bundled artwork under /images is listed explicitly.
    localPatterns: [{ pathname: '/images/**' }],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
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
      { source: '/account/:path*', headers: privateNoStoreHeaders },
      { source: '/my-account', headers: privateNoStoreHeaders },
      { source: '/admin/:path*', headers: privateNoStoreHeaders },
      { source: '/api/admin/:path*', headers: privateNoStoreHeaders },
      { source: '/auth/:path*', headers: privateNoStoreHeaders },
      { source: '/cart', headers: privateNoStoreHeaders },
      { source: '/track-order', headers: privateNoStoreHeaders },
    ]
  },
}

export default nextConfig
