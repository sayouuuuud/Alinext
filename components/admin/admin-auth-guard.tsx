'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/lib/admin/admin-context'

type Step = 'checking' | 'login' | 'enroll' | 'challenge' | 'ready'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { locale } = useAdmin()
  const [step, setStep] = useState<Step>('checking')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const copy = locale === 'ar'
    ? {
        title: 'لوحة تحكم علي فليت', lead: 'دخول آمن عبر Supabase Auth والمصادقة الثنائية.',
        email: 'البريد الإلكتروني', password: 'كلمة المرور', login: 'تسجيل الدخول', checking: 'جاري التحقق من الجلسة...',
        mfaTitle: 'المصادقة الثنائية', enroll: 'امسح رمز QR بتطبيق المصادقة ثم أدخل الرمز المكوّن من 6 أرقام.',
        challenge: 'أدخل الرمز الحالي من تطبيق المصادقة.', verify: 'تحقق وافتح اللوحة', invalid: 'تعذر التحقق. راجع البيانات والرمز ثم حاول مجددًا.',
      }
    : {
        title: 'ALI FLEET Admin', lead: 'Secure access with Supabase Auth and multi-factor authentication.',
        email: 'Email address', password: 'Password', login: 'Sign in', checking: 'Checking your session...',
        mfaTitle: 'Two-factor authentication', enroll: 'Scan the QR code with your authenticator app, then enter the 6-digit code.',
        challenge: 'Enter the current code from your authenticator app.', verify: 'Verify and open dashboard', invalid: 'Verification failed. Check your details and code, then try again.',
      }

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((result) => {
        if (result.ok) {
          setStep('ready')
          window.dispatchEvent(new Event('alifleet-admin-authenticated'))
        } else {
          setStep('login')
        }
      })
      .catch(() => setStep('login'))
  }, [])

  async function establishAdminSession() {
    const result = await fetch('/api/admin/session', { method: 'POST' })
    if (result.ok) {
      setStep('ready')
      window.dispatchEvent(new Event('alifleet-admin-authenticated'))
      return true
    }
    const payload = await result.json().catch(() => ({ code: 'unexpected' }))
    if (payload.code === 'mfa_required') {
      const supabase = createClient()
      const factors = await supabase.auth.mfa.listFactors()
      if (factors.error) throw factors.error
      const verifiedFactor = factors.data.totp.find((factor) => factor.status === 'verified')
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id)
        setStep('challenge')
      } else {
        const enrollment = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'ALI FLEET Admin' })
        if (enrollment.error) throw enrollment.error
        setFactorId(enrollment.data.id)
        setQrCode(enrollment.data.totp.qr_code)
        setSecret(enrollment.data.totp.secret)
        setStep('enroll')
      }
      return false
    }
    await createClient().auth.signOut()
    throw new Error('admin_session_rejected')
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const { error: loginError } = await createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (loginError) throw loginError
      await establishAdminSession()
    } catch {
      setError(copy.invalid)
      setStep('login')
    } finally {
      setPending(false)
    }
  }

  async function handleMfa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError(copy.invalid)
      return
    }
    setPending(true)
    setError('')
    try {
      const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({ factorId, code })
      if (verifyError) throw verifyError
      await establishAdminSession()
    } catch {
      setError(copy.invalid)
    } finally {
      setPending(false)
    }
  }

  if (step === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          {copy.checking}
        </div>
      </div>
    )
  }

  if (step === 'ready') return <>{children}</>

  const isMfa = step === 'enroll' || step === 'challenge'
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <section className="w-full max-w-md rounded-3xl bg-card p-7 shadow-xl ring-1 ring-border md:p-8" aria-labelledby="admin-auth-title">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-accent">
            <ShieldCheck className="size-7" aria-hidden="true" />
          </div>
          <div>
            <h1 id="admin-auth-title" className="text-balance font-serif text-2xl font-bold tracking-tight">{isMfa ? copy.mfaTitle : copy.title}</h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{isMfa ? (step === 'enroll' ? copy.enroll : copy.challenge) : copy.lead}</p>
          </div>
        </div>

        {error ? (
          <div role="alert" className="mt-5 flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {!isMfa ? (
          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium">
              {copy.email}
              <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} className="rounded-full border border-border bg-background px-4 py-3 outline-none focus:border-accent" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              {copy.password}
              <span className="relative">
                <KeyRound className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} className="w-full rounded-full border border-border bg-background py-3 ps-11 pe-12 outline-none focus:border-accent" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute end-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            <button type="submit" disabled={pending} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-60">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {copy.login}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfa} className="mt-6 flex flex-col gap-4">
            {step === 'enroll' && qrCode ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-background p-4 ring-1 ring-border">
                <img src={qrCode} alt="TOTP enrollment QR code" className="size-48 rounded-xl" />
                <code className="max-w-full break-all text-center text-xs text-muted-foreground">{secret}</code>
              </div>
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-medium">
              {copy.mfaTitle}
              <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={pending} className="rounded-full border border-border bg-background px-4 py-3 text-center font-mono text-xl tracking-[0.35em] outline-none focus:border-accent" />
            </label>
            <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-60">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {copy.verify}
            </button>
          </form>
        )}

        <Link href="/" className="mt-6 block text-center text-sm text-muted-foreground underline-offset-4 hover:underline">{locale === 'ar' ? 'العودة إلى الموقع' : 'Return to storefront'}</Link>
      </section>
    </main>
  )
}
