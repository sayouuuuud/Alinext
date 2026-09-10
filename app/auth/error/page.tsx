import type { Metadata } from 'next'
import LocaleLink from '@/components/locale-link'

export const metadata: Metadata = { title: 'Authentication error | ALI FLEET', robots: { index: false, follow: false } }

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-24">
      <section className="w-full rounded-3xl bg-card p-8 text-center ring-1 ring-border">
        <h1 className="font-serif text-3xl tracking-tight text-foreground">Authentication link unavailable</h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">The link may have expired or already been used. Request a new secure link and try again.</p>
        <LocaleLink href="/account/forgot-password" className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground">Request a new link</LocaleLink>
      </section>
    </main>
  )
}
