import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { listAdminUsers } from '@/lib/admin/operations-server'
import { AdminSessionError } from '@/lib/admin/session-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const result = await listAdminUsers({
      q: url.searchParams.get('q') || '',
      status: url.searchParams.get('status') || 'all',
      tier: url.searchParams.get('tier') || 'all',
      sort: url.searchParams.get('sort') || 'joined',
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '20',
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof AdminSessionError) return NextResponse.json({ error: error.code }, { status: error.code === 'not_authorized' ? 403 : 401 })
    if (error instanceof ZodError) return NextResponse.json({ error: 'invalid_query' }, { status: 422 })
    return NextResponse.json({ error: 'users_unavailable' }, { status: 500 })
  }
}
