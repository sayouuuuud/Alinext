import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase public configuration is missing')
  return { url, key }
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const { url, key } = publicConfig()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookieOptions: { secure: process.env.NODE_ENV === 'production' },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot write cookies; the root proxy refreshes them.
        }
      },
    },
  })
}

export function createAdminClient(): SupabaseClient<Database> {
  const { url } = publicConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const getSupabaseServerClient = createClient
export const getSupabaseAdminClient = createAdminClient
