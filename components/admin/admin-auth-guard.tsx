'use client'

import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { content, t, locale } = useAdmin()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activePassword = content.security?.passwordHash || 'alifleet2026'

  useEffect(() => {
    try {
      const auth = window.sessionStorage.getItem('alifleet_admin_auth')
      if (auth === 'true') {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    setTimeout(() => {
      if (passwordInput === activePassword) {
        try {
          window.sessionStorage.setItem('alifleet_admin_auth', 'true')
        } catch {}
        setIsAuthenticated(true)
      } else {
        setError(
          locale === 'ar'
            ? 'كلمة المرور غير صحيحة! يرجى المحاولة مجدداً.'
            : locale === 'he'
            ? 'סיסמה שגויה! נסה שוב.'
            : 'Incorrect password! Please try again.'
        )
      }
      setIsSubmitting(false)
    }, 300)
  }

  // Prevent flash while checking session
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const isRtl = locale === 'ar' || locale === 'he'
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/30 to-background p-4 text-foreground">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl space-y-6">
          {/* Brand & Shield Emblem */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {locale === 'ar' ? 'لوحة تحكم علي فليت' : locale === 'he' ? 'לוח ניהול ALI FLEET' : 'ALI FLEET Admin'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar'
                ? 'منطقة محمية — يرجى إدخال كلمة المرور للوصول إلى لوحة الإدارة'
                : locale === 'he'
                ? 'אזור מאובטח — הזן סיסמה כדי לגשת ללוח הניהול'
                : 'Restricted Area — Enter master password to access administration'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>{locale === 'ar' ? 'كلمة المرور' : locale === 'he' ? 'סיסמה' : 'Password'}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {locale === 'ar' ? 'الافتراضي: alifleet2026' : 'Default: alifleet2026'}
                </span>
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-border bg-background ps-10 pe-11 py-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-shake">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 px-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Lock className="size-4" />
              <span>{isSubmitting ? (locale === 'ar' ? 'جاري التحقق...' : 'Verifying...') : (locale === 'ar' ? 'تسجيل الدخول للوحة' : 'Unlock Dashboard')}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="pt-2 text-center">
            <a
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              {locale === 'ar' ? '← العودة للموقع الرئيسي' : '← Return to storefront'}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
