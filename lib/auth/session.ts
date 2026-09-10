import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function clearSessionCookies(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function hasSession(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return Boolean(data.user)
}

export async function getAuthToken(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
