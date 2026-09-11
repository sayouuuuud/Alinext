import { NextResponse } from 'next/server'
import { loadNotifications } from '@/lib/notifications/queries'
import { markNotificationsRead } from '@/lib/notifications/actions'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') || 20)
    const result = await loadNotifications(Number.isFinite(limit) ? limit : 20)
    if (!result.signedIn) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'notifications_unavailable' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null)
  const result = await markNotificationsRead(payload)
  return NextResponse.json(result, { status: result.ok ? 200 : result.error === 'not_authenticated' ? 401 : 422 })
}
