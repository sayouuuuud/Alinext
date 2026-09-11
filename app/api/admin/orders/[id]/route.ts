import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { updateAdminOrder } from '@/lib/admin/operations-server'
import { AdminSessionError } from '@/lib/admin/session-server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await request.json()
    const order = await updateAdminOrder(id, payload)
    return NextResponse.json({ order })
  } catch (error) {
    if (error instanceof AdminSessionError) return NextResponse.json({ error: error.code }, { status: error.code === 'not_authorized' ? 403 : 401 })
    if (error instanceof ZodError) return NextResponse.json({ error: 'invalid_request' }, { status: 422 })
    const code = error instanceof Error ? error.message : 'order_update_failed'
    return NextResponse.json({ error: code }, { status: code === 'order_update_failed' ? 500 : 422 })
  }
}
