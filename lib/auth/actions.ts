'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { AuthActionState, AuthErrorCode } from './types'

const emailSchema = z.string().trim().email().max(254)
const passwordSchema = z.string().min(8).max(128)
const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{3,40}$/)
const text = (max: number) => z.string().trim().max(max)

function errorState(code: AuthErrorCode, field?: string): AuthActionState {
  return { status: 'error', code, fieldErrors: field ? { [field]: code } : undefined }
}

function safeRedirect(value: FormDataEntryValue | null, fallback = '/account') {
  const path = String(value || fallback)
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : fallback
}

async function callbackUrl(next: string) {
  const configured = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  if (configured) {
    const url = new URL(configured)
    url.searchParams.set('next', next)
    return url.toString()
  }
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  return `${protocol}://${host}/auth/callback?next=${encodeURIComponent(next)}`
}

function mapAuthError(error: { code?: string; status?: number; message?: string }, context: 'login' | 'register' | 'reset'): AuthErrorCode {
  if (error.status === 429 || error.code?.includes('rate_limit')) return 'rate_limited'
  if (error.code === 'email_not_confirmed') return 'email_unconfirmed'
  if (error.code === 'weak_password') return 'weak_password'
  if (context === 'login' && ['invalid_credentials', 'user_not_found'].includes(error.code || '')) return 'invalid_credentials'
  if (context === 'register' && error.message?.includes('profiles_username_key')) return 'username_exists'
  if (context === 'reset') return 'reset_unavailable'
  return 'unknown'
}

async function resolveEmail(identifier: string): Promise<string | null> {
  const email = emailSchema.safeParse(identifier)
  if (email.success) return email.data.toLowerCase()

  const username = usernameSchema.safeParse(identifier)
  if (!username.success) return null
  const { data, error } = await createAdminClient()
    .from('profiles')
    .select('email')
    .eq('username', username.data)
    .maybeSingle()
  return error ? null : data?.email ?? null
}

export async function loginAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = String(formData.get('usernameOrEmail') || '').trim()
  const password = String(formData.get('password') || '')
  if (!identifier || !password) return errorState('missing_fields')

  const email = await resolveEmail(identifier)
  if (!email) return errorState('invalid_credentials')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return errorState(mapAuthError(error, 'login'))

  revalidatePath('/', 'layout')
  redirect(safeRedirect(formData.get('redirectTo')))
}

export async function registerAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const firstName = text(60).safeParse(formData.get('firstName'))
  const lastName = text(60).safeParse(formData.get('lastName'))
  const email = emailSchema.safeParse(formData.get('email'))
  const password = passwordSchema.safeParse(formData.get('password'))
  const confirmPassword = String(formData.get('confirmPassword') || '')
  const phone = text(40).safeParse(formData.get('phone') || '')
  const requestedUsername = String(formData.get('username') || '').trim() || (email.success ? email.data.split('@')[0] : '')
  const username = usernameSchema.safeParse(requestedUsername)

  if (!firstName.success || !lastName.success || !email.success || !password.success || !phone.success) {
    return errorState(!email.success ? 'invalid_email' : !password.success ? 'weak_password' : 'missing_fields')
  }
  if (!username.success) return errorState('username_exists', 'username')
  if (password.data !== confirmPassword) return errorState('password_mismatch', 'confirmPassword')

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: email.data.toLowerCase(),
    password: password.data,
    options: {
      emailRedirectTo: await callbackUrl('/account'),
      data: {
        first_name: firstName.data,
        last_name: lastName.data,
        display_name: `${firstName.data} ${lastName.data}`.trim(),
        username: username.data,
        phone: phone.data || null,
        preferred_locale: String(formData.get('locale') || 'ar'),
      },
    },
  })

  if (error) return errorState(mapAuthError(error, 'register'))
  return { status: 'success' }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function forgotPasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = String(formData.get('usernameOrEmail') || '').trim()
  if (!identifier) return errorState('missing_fields')
  const email = await resolveEmail(identifier)
  if (!email) return { status: 'success' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await callbackUrl('/account/update-password'),
  })
  if (error?.status === 429 || error?.code?.includes('rate_limit')) {
    return errorState('rate_limited')
  }
  return { status: 'success' }
}

export async function updatePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = passwordSchema.safeParse(formData.get('newPassword'))
  const confirmation = String(formData.get('confirmPassword') || '')
  if (!password.success) return errorState('weak_password', 'newPassword')
  if (password.data !== confirmation) return errorState('password_mismatch', 'confirmPassword')

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return errorState('not_logged_in')
  const { error } = await supabase.auth.updateUser({ password: password.data })
  if (error) return errorState(mapAuthError(error, 'reset'))
  await createAdminClient()
    .from('admin_memberships')
    .update({ must_change_password: false })
    .eq('user_id', userData.user.id)
  revalidatePath('/', 'layout')
  return { status: 'success' }
}

export async function updateProfileAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const firstName = text(60).safeParse(formData.get('firstName') || '')
  const lastName = text(60).safeParse(formData.get('lastName') || '')
  const email = emailSchema.safeParse(formData.get('email'))
  const newPassword = String(formData.get('newPassword') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')
  if (!firstName.success || !lastName.success || !email.success) return errorState('missing_fields')
  if (newPassword && !passwordSchema.safeParse(newPassword).success) return errorState('weak_password')
  if (newPassword !== confirmPassword) return errorState('password_mismatch')

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return errorState('not_logged_in')

  const displayName = `${firstName.data} ${lastName.data}`.trim()
  const authUpdate = {
    data: { ...userData.user.user_metadata, first_name: firstName.data, last_name: lastName.data, display_name: displayName },
    ...(email.data.toLowerCase() !== userData.user.email?.toLowerCase() ? { email: email.data.toLowerCase() } : {}),
    ...(newPassword ? { password: newPassword } : {}),
  }
  const { error: authError } = await supabase.auth.updateUser(authUpdate)
  if (authError) return errorState(mapAuthError(authError, 'reset'))

  const { error: profileError } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', userData.user.id)
  if (profileError) return errorState('unknown')
  revalidatePath('/account', 'layout')
  return { status: 'success' }
}

function addressFromForm(formData: FormData, prefix: 'billing' | 'shipping') {
  const value = (key: string, max = 250) => String(formData.get(`${prefix}_${key}`) || '').trim().slice(0, max)
  return {
    kind: prefix,
    label: value('company', 120) || (prefix === 'billing' ? 'Billing' : 'Shipping'),
    full_name: `${value('firstName', 60)} ${value('lastName', 60)}`.trim(),
    company: value('company', 120) || null,
    street: value('address1'),
    address_line_2: value('address2') || null,
    city: value('city', 120),
    state: value('state', 120) || null,
    postal_code: value('postcode', 30) || null,
    country: value('country', 120),
    phone: value('phone', 40),
    is_default: true,
  }
}

export async function updateAddressesAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return errorState('not_logged_in')

  for (const kind of ['billing', 'shipping'] as const) {
    const address = addressFromForm(formData, kind)
    if (!address.full_name || !address.street || !address.city || !address.country || !address.phone) {
      return errorState('missing_fields')
    }
    const { data: existing, error: lookupError } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('kind', kind)
      .eq('is_default', true)
      .maybeSingle()
    if (lookupError) return errorState('unknown')
    const result = existing
      ? await supabase.from('addresses').update(address).eq('id', existing.id)
      : await supabase.from('addresses').insert({ ...address, user_id: userData.user.id })
    if (result.error) return errorState('unknown')
  }

  revalidatePath('/account/addresses')
  return { status: 'success' }
}
