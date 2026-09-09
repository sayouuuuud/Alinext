/**
 * Supabase connection configuration.
 *
 * The site currently runs on a file-backed content store
 * (see `lib/content/repository.ts`). These helpers let the app detect when
 * Supabase credentials have been added so the data layer can be switched over
 * without touching call sites. Until the env vars below are set,
 * `isSupabaseConfigured()` returns false and every Supabase client factory
 * returns null — nothing in the running app depends on Supabase yet.
 *
 * To activate later:
 *   1. Add the env vars (see `.env.example`).
 *   2. Run `supabase/schema.sql` against your project.
 *   3. Point the content repository at the Supabase-backed source.
 */

export const SUPABASE_URL_ENV = 'NEXT_PUBLIC_SUPABASE_URL'
export const SUPABASE_ANON_KEY_ENV = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
export const SUPABASE_SERVICE_ROLE_KEY_ENV = 'SUPABASE_SERVICE_ROLE_KEY'

export function getSupabaseUrl(): string | undefined {
  return process.env[SUPABASE_URL_ENV]
}

export function getSupabaseAnonKey(): string | undefined {
  return process.env[SUPABASE_ANON_KEY_ENV]
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env[SUPABASE_SERVICE_ROLE_KEY_ENV]
}

/** True only when the public URL + anon key are both present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

/** True when the privileged service-role key is also present (server only). */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && getSupabaseServiceRoleKey())
}
