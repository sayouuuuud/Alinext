import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminUserDetail, updateAdminUser } from '@/lib/admin/operations-server'
import { AdminSessionError } from '@/lib/admin/session-server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function errorResponse(error: unknown) {
  if (error instanceof AdminSessionError) return NextResponse.json({ error: error.code }, { status: error.code === 'not_authorized' ? 403 : 401 })
  if (error instanceof ZodError) return NextResponse.json({ error: 'invalid_request' }, { status: 422 })
  const code = error instanceof Error ? error.message : 'unexpected'
  const status = code === 'admin_account_protected' || code === 'admin_account_hidden' ? 403 : code === 'user_unavailable' ? 500 : 422
  return NextResponse.json({ error: code }, { status })
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const detail = await getAdminUserDetail(id)
    if (!detail) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json(detail, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await request.json()
    const profile = await updateAdminUser(id, payload)
    if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ profile })
  } catch (error) {
    return errorResponse(error)
  }
}
