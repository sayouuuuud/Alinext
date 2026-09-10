import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdminSessionError, createAdminSession, revokeAdminSession, validateAdminSession } from '@/lib/admin/session-server'

export const dynamic = 'force-dynamic'

function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function sessionError(error: unknown) {
  if (!(error instanceof AdminSessionError)) return response({ ok: false, code: 'unexpected' }, 500)
  const status = error.code === 'not_authorized' ? 403 : error.code === 'mfa_required' ? 428 : 401
  return response({ ok: false, code: error.code }, status)
}

export async function GET() {
  try {
    const session = await validateAdminSession()
    return response({ ok: true, session })
  } catch (error) {
    return sessionError(error)
  }
}

export async function POST() {
  try {
    const session = await createAdminSession()
    return response({ ok: true, session })
  } catch (error) {
    return sessionError(error)
  }
}

export async function PATCH() {
  try {
    const session = await validateAdminSession()
    const { createAdminClient } = await import('@/lib/supabase/server')
    const { error } = await createAdminClient()
      .from('admin_memberships')
      .update({ must_change_password: false })
      .eq('user_id', session.userId)
    return error ? response({ ok: false }, 500) : response({ ok: true })
  } catch (error) {
    return sessionError(error)
  }
}

export async function DELETE() {
  await revokeAdminSession()
  const supabase = await createClient()
  await supabase.auth.signOut()
  return response({ ok: true })
}
