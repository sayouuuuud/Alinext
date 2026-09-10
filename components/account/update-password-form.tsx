'use client'

import { useActionState } from 'react'
import LocaleLink from '@/components/locale-link'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { updatePasswordAction } from '@/lib/auth/actions'
import { idleActionState } from '@/lib/auth/types'
import { PasswordField } from './form-field'
import { FormError } from './alerts'

export function UpdatePasswordForm() {
  const { t, locale } = useLanguage()
  const [state, formAction, pending] = useActionState(updatePasswordAction, idleActionState)

  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center ring-1 ring-border">
        <CheckCircle2 className="size-8 text-accent" aria-hidden="true" />
        <h1 className="font-serif text-3xl tracking-tight text-foreground">{locale === 'ar' ? 'تم تحديث كلمة المرور' : locale === 'he' ? 'הסיסמה עודכנה' : 'Password updated'}</h1>
        <LocaleLink href="/account" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground">{locale === 'ar' ? 'الانتقال إلى الحساب' : locale === 'he' ? 'מעבר לחשבון' : 'Go to account'}</LocaleLink>
      </div>
    )
  }

  return (
    <form action={formAction} className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">{locale === 'ar' ? 'تعيين كلمة مرور جديدة' : locale === 'he' ? 'הגדרת סיסמה חדשה' : 'Set a new password'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{locale === 'ar' ? 'استخدم 8 أحرف على الأقل ولا تعِد استخدام كلمة مرور قديمة.' : locale === 'he' ? 'יש להשתמש ב-8 תווים לפחות ולא למחזר סיסמה ישנה.' : 'Use at least 8 characters and do not reuse an old password.'}</p>
        </div>
        {state.status === 'error' ? <FormError>{t.account.errors[state.code as keyof typeof t.account.errors] ?? t.account.errors.unknown}</FormError> : null}
        <PasswordField label={t.account.fields.newPassword} name="newPassword" required autoComplete="new-password" placeholder={t.account.placeholders.password} disabled={pending} />
        <PasswordField label={t.account.fields.confirmPassword} name="confirmPassword" required autoComplete="new-password" placeholder={t.account.placeholders.password} disabled={pending} />
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {locale === 'ar' ? 'حفظ كلمة المرور' : locale === 'he' ? 'שמירת הסיסמה' : 'Save password'}
        </button>
      </div>
    </form>
  )
}
