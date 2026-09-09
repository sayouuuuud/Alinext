'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LocaleLink from '@/components/locale-link'
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { registerAction } from '@/lib/auth/actions'
import { idleActionState } from '@/lib/auth/types'
import { Field, PasswordField } from './form-field'
import { FormError } from './alerts'
import { getStoredContent, saveContent } from '@/lib/admin/content-store'
import type { CustomerItem } from '@/lib/admin/types'

export function RegisterForm() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const firstName = String(formData.get('firstName') || '').trim()
    const lastName = String(formData.get('lastName') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const username = String(formData.get('username') || '').trim() || email.split('@')[0]
    const phone = String(formData.get('phone') || '').trim()
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (!email || !firstName || !lastName || !password) {
      setErrorMsg(t.account.errors.missing_fields || 'يرجى تعبئة كافة الحقول المطلوبة')
      setPending(false)
      return
    }

    if (password.length < 8) {
      setErrorMsg(t.account.errors.weak_password || 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل')
      setPending(false)
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg(t.account.errors.password_mismatch || 'كلمتا المرور غير متطابقتين')
      setPending(false)
      return
    }

    try {
      // 1. Save new customer directly into Admin content store
      const stored = getStoredContent()
      const existingCustomers = stored.customers || []
      const customerName = `${firstName} ${lastName}`.trim()

      const existingIndex = existingCustomers.findIndex(
        (c) => c.email.toLowerCase() === email.toLowerCase() || (phone && c.phone === phone)
      )

      const newCustomer: CustomerItem = {
        id: `cust-${Date.now()}`,
        name: customerName,
        email,
        phone: phone || '+972 50-000-0000',
        avatar: '',
        tier: 'Regular',
        status: 'active',
        joinedDate: new Date().toISOString().slice(0, 10),
        billingAddress: {
          street: '',
          city: '',
          country: 'إسرائيل',
          postalCode: '',
        },
        shippingAddress: {
          street: '',
          city: '',
          country: 'إسرائيل',
        },
        ordersCount: 0,
        totalSpent: 0,
        notes: `تم إنشاء الحساب عبر الموقع الإلكتروني بتاريخ ${new Date().toLocaleDateString('ar-EG')}`,
        orders: [],
      }

      let updatedCustomers = [...existingCustomers]
      if (existingIndex >= 0) {
        updatedCustomers[existingIndex] = {
          ...updatedCustomers[existingIndex],
          name: customerName,
          phone: phone || updatedCustomers[existingIndex].phone,
        }
      } else {
        updatedCustomers.unshift(newCustomer)
      }

      saveContent({
        ...stored,
        customers: updatedCustomers,
      })

      // 2. Set user cookie for immediate client identification
      try {
        const sessionPayload = {
          id: newCustomer.id,
          name: customerName,
          email,
          phone,
        }
        document.cookie = `alifleet_session_user=${encodeURIComponent(
          JSON.stringify(sessionPayload)
        )}; path=/; max-age=2592000; SameSite=Lax`
      } catch {}

      // 3. Attempt server action in background without blocking
      try {
        registerAction(idleActionState, formData).catch(() => {})
      } catch {}

      setSuccess(true)
      setTimeout(() => {
        router.push('/account')
        router.refresh()
      }, 800)
    } catch (err) {
      console.error('Registration failed:', err)
      setErrorMsg(t.account.errors.unknown || 'حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً')
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8"
    >
      <div className="flex flex-col gap-5">
        {errorMsg ? <FormError>{errorMsg}</FormError> : null}

        {success ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>
              {locale === 'ar'
                ? 'تم إنشاء الحساب بنجاح! جاري تحويلك إلى لوحة حسابك...'
                : 'Account created successfully! Redirecting...'}
            </span>
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.account.fields.firstName}
            name="firstName"
            required
            autoComplete="given-name"
            placeholder={t.account.placeholders.firstName}
            disabled={pending || success}
          />
          <Field
            label={t.account.fields.lastName}
            name="lastName"
            required
            autoComplete="family-name"
            placeholder={t.account.placeholders.lastName}
            disabled={pending || success}
          />
        </div>

        <Field
          label={t.account.fields.email}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.account.placeholders.email}
          disabled={pending || success}
        />

        <Field
          label={t.account.fields.username}
          name="username"
          autoComplete="username"
          placeholder={t.account.placeholders.username}
          hint={t.account.register.usernameHint}
          disabled={pending || success}
        />

        <Field
          label={t.account.fields.phone}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={t.account.placeholders.phone}
          disabled={pending || success}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField
            label={t.account.fields.password}
            name="password"
            required
            autoComplete="new-password"
            placeholder={t.account.placeholders.password}
            hint={t.account.register.passwordHint}
            disabled={pending || success}
          />
          <PasswordField
            label={t.account.fields.confirmPassword}
            name="confirmPassword"
            required
            autoComplete="new-password"
            placeholder={t.account.placeholders.password}
            disabled={pending || success}
          />
        </div>

        <button
          type="submit"
          disabled={pending || success}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.account.register.submitting}
            </>
          ) : (
            <>
              {t.account.register.submit}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {t.account.register.haveAccount}{' '}
          <LocaleLink
            href="/account/login"
            className="text-accent underline-offset-4 transition-colors hover:underline"
          >
            {t.account.register.loginLink}
          </LocaleLink>
        </p>
      </div>
    </form>
  )
}
