import { NextResponse } from 'next/server'
import { getAdminDashboardSummary } from '@/lib/admin/dashboard-summary-server'
import { AdminSessionError, requireAdminPermission } from '@/lib/admin/session-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdminPermission('dashboard.read')
    return NextResponse.json(await getAdminDashboardSummary(), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    if (error instanceof AdminSessionError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'not_authorized' || error.code === 'mfa_required' ? 403 : 401 },
      )
    }
    return NextResponse.json({ error: 'summary_unavailable' }, { status: 500 })
  }
}
