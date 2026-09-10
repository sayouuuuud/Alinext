import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/database.types'

export const ADMIN_SESSION_COOKIE = 'alifleet_admin_session'

type AdminRole = Database['public']['Enums']['admin_role']

export type ValidAdminSession = {
  userId: string
  email: string
  role: AdminRole
  mustChangePassword: boolean
  demoOnly: boolean
}

export class AdminSessionError extends Error {
  constructor(public code: 'not_authenticated' | 'not_authorized' | 'mfa_required' | 'session_expired') {
    super(code)
  }
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function demoAllowed() {
  return process.env.VERCEL_ENV !== 'production'
}

async function inactivityMinutes() {
  const admin = createAdminClient()
  const { data } = await admin.from('site_settings_private').select('value').eq('key', 'admin_security').maybeSingle()
  const value = data?.value && typeof data.value === 'object' && !Array.isArray(data.value)
    ? (data.value as Record<string, Json | undefined>)
    : {}
  const configured = Number(value.session_timeout_minutes || 60)
  return Math.min(480, Math.max(15, Number.isFinite(configured) ? configured : 60))
}

async function currentIdentity() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user?.email) throw new AdminSessionError('not_authenticated')
  return { supabase, user: data.user }
}

async function membershipFor(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_memberships')
    .select('role,active,demo_only,must_change_password,mfa_required')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data || !data.active || (data.demo_only && !demoAllowed())) {
    throw new AdminSessionError('not_authorized')
  }
  return data
}

async function requireAal2(supabase: Awaited<ReturnType<typeof createClient>>, required: boolean) {
  if (!required) return
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || data.currentLevel !== 'aal2') throw new AdminSessionError('mfa_required')
}

export async function createAdminSession(): Promise<ValidAdminSession> {
  const { supabase, user } = await currentIdentity()
  const membership = await membershipFor(user.id)
  await requireAal2(supabase, membership.mfa_required)

  const timeout = await inactivityMinutes()
  const token = randomBytes(32).toString('base64url')
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + timeout * 60_000)
  const requestHeaders = await headers()
  const forwardedIp = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  const admin = createAdminClient()

  const { error } = await admin.from('admin_sessions').insert({
    user_id: user.id,
    token_hash: tokenHash,
    ip_hash: forwardedIp ? sha256(forwardedIp) : null,
    user_agent: requestHeaders.get('user-agent')?.slice(0, 500) || null,
    expires_at: expiresAt.toISOString(),
  })
  if (error) throw new AdminSessionError('not_authorized')

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  })

  return {
    userId: user.id,
    email: user.email || '',
    role: membership.role,
    mustChangePassword: membership.must_change_password,
    demoOnly: membership.demo_only,
  }
}

export async function validateAdminSession(touch = true): Promise<ValidAdminSession> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) throw new AdminSessionError('not_authenticated')

  const { supabase, user } = await currentIdentity()
  const membership = await membershipFor(user.id)
  await requireAal2(supabase, membership.mfa_required)

  const admin = createAdminClient()
  const { data: session, error } = await admin
    .from('admin_sessions')
    .select('id,user_id,last_active_at,expires_at,revoked_at')
    .eq('token_hash', sha256(token))
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) {
    cookieStore.delete(ADMIN_SESSION_COOKIE)
    throw new AdminSessionError('session_expired')
  }

  if (touch) {
    const timeout = await inactivityMinutes()
    const expiresAt = new Date(Date.now() + timeout * 60_000)
    await admin.from('admin_sessions').update({
      last_active_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }).eq('id', session.id)
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: expiresAt,
    })
  }

  return {
    userId: user.id,
    email: user.email || '',
    role: membership.role,
    mustChangePassword: membership.must_change_password,
    demoOnly: membership.demo_only,
  }
}

export async function revokeAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (token) {
    await createAdminClient().from('admin_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', sha256(token))
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}
