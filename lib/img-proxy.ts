/**
 * Returns the image source as-is, falling back to the bundled placeholder.
 * Kept as a tiny helper so call sites stay stable — all catalog imagery is
 * local or HTTPS.
 */
export function proxied(src: string | null | undefined): string {
  return src || '/placeholder.svg'
}
