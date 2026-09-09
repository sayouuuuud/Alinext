function notFound() {
  return new Response(null, {
    status: 404,
    headers: { 'cache-control': 'private, no-store, max-age=0' },
  })
}

export const GET = notFound
export const POST = notFound
export const PUT = notFound
export const PATCH = notFound
export const DELETE = notFound
export const HEAD = notFound
export const OPTIONS = notFound
