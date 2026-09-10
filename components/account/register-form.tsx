'use client'

import { useActionState } from 'react'
import LocaleLink from '@/components/locale-link'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { registerAction } from '@/lib/auth/actions'
import { idleActionState } from '@/lib/auth/types'
import { Field, PasswordField } from './form-field'
import { FormError } from './alerts'

export function RegisterForm() {
  const { t, locale } = useLanguage()
  const [state, formAction, pending] = useActionState(registerAction, idleActionState)

  if (state.status === 'success') {
    return (
      <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="size-8 text-accent" aria-hidden="true" />
          <h2 className="font-serif text-2xl tracking-tight text-foreground">
            {locale === 'ar' ? 'تحقق من بريدك الإلكتروني' : locale === 'he' ? 'בדוק את תיבת הדואר שלך' : 'Check your email'}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {locale === 'ar' ? 'أرسلنا رابط تأكيد آمن. بعد تأكيد البريد يمكنك تسجيل الدخول وإتمام الطلبات.' : locale === 'he' ? 'שלחנו קישור אימות מאובטח. לאחר האימות ניתן להתחבר ולהשלים הזמנות.' : 'We sent a secure confirmation link. After confirming, you can sign in and place orders.'}
          </p>
          <LocaleLink href="/account/login" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground">
            {t.account.register.loginLink}
          </LocaleLink>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-col gap-5">
        {state.status === 'error' ? (
          <FormError>{t.account.errors[state.code as keyof typeof t.account.errors] ?? t.account.errors.unknown}</FormError>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.account.fields.firstName} name="firstName" required autoComplete="given-name" placeholder={t.account.placeholders.firstName} disabled={pending} />
          <Field label={t.account.fields.lastName} name="lastName" required autoComplete="family-name" placeholder={t.account.placeholders.lastName} disabled={pending} />
        </div>
        <Field label={t.account.fields.email} name="email" type="email" required autoComplete="email" placeholder={t.account.placeholders.email} disabled={pending} />
        <Field label={t.account.fields.username} name="username" autoComplete="username" placeholder={t.account.placeholders.username} hint={t.account.register.usernameHint} disabled={pending} />
        <Field label={t.account.fields.phone} name="phone" type="tel" autoComplete="tel" placeholder={t.account.placeholders.phone} disabled={pending} />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField label={t.account.fields.password} name="password" required autoComplete="new-password" placeholder={t.account.placeholders.password} hint={t.account.register.passwordHint} disabled={pending} />
          <PasswordField label={t.account.fields.confirmPassword} name="confirmPassword" required autoComplete="new-password" placeholder={t.account.placeholders.password} disabled={pending} />
        </div>
        <button type="submit" disabled={pending} className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
          {pending ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />{t.account.register.submitting}</> : <>{t.account.register.submit}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></>}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          {t.account.register.haveAccount}{' '}<LocaleLink href="/account/login" className="text-accent underline-offset-4 hover:underline">{t.account.register.loginLink}</LocaleLink>
        </p>
      </div>
    </form>
  )
}
