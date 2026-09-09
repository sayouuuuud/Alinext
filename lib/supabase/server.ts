import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from './config'

/**
 * Server-side Supabase client bound to the request's cookies.
 *
 * Use this from Server Components and Route Handlers when user sessions
 * matter. Returns null while Supabase env vars are absent so the current
 * file-backed content store keeps working untouched.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()
  if (!url || !anonKey) return null

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — safe to ignore once middleware
          // refreshes sessions (wired up when Supabase is activated).
        }
      },
    },
  })
}

/**
 * Privileged server client using the service-role key.
 *
 * Bypasses Row Level Security — only ever use this in trusted server code
 * (e.g. the admin content API) and never expose it to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()
  if (!url || !serviceRoleKey) return null

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
