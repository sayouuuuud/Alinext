import { NextResponse } from 'next/server'
import { listAdminOrders } from '@/lib/admin/operations-server'
import { AdminSessionError } from '@/lib/admin/session-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await listAdminOrders()
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof AdminSessionError) return NextResponse.json({ error: error.code }, { status: error.code === 'not_authorized' ? 403 : 401 })
    return NextResponse.json({ error: 'orders_unavailable' }, { status: 500 })
  }
}
