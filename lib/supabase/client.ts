'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

/**
 * Browser-side Supabase client (singleton).
 *
 * Returns null while Supabase env vars are absent so components can feature
 * flag on `isSupabaseConfigured()` without the app crashing in the current
 * file-backed setup.
 */
let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()
  if (!url || !anonKey) return null

  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey)
  }
  return browserClient
}
