import type { Locale } from './config'

/**
 * A single piece of CMS-editable text, held per language.
 *
 * Lives in its own module so client components can share the type and resolver
 * without pulling server-only repository code into the browser bundle.
 */
export type CopyBlock = Partial<Record<Locale, string>>

/**
 * Returns the CMS value for the active language, or `fallback` when the editor
 * has not filled that language in.
 *
 * Overrides are resolved strictly per language — no cross-language borrowing.
 * Showing an Arabic heading to an English visitor because only Arabic was
 * filled in would be worse than showing the translated default we already ship.
 */
export function resolveCopy(
  block: CopyBlock | undefined,
  locale: Locale,
  fallback: string
): string {
  const value = block?.[locale]
  return value && value.trim() ? value : fallback
}
