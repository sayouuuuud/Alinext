'use client'

import React, { useState } from 'react'
import {
  Moon,
  Sun,
  Globe,
  ExternalLink,
  Save,
  ShieldAlert,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import type { AdminLocale } from '@/lib/admin/admin-i18n'

export function AdminHeader() {
  const {
    t,
    locale,
    setLocale,
    theme,
    toggleTheme,
    saveAll,
    isSaving,
    resetDefaults,
    content,
    updateContent,
  } = useAdmin()

  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const languages: { code: AdminLocale; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const currentLang = languages.find((l) => l.code === locale) || languages[0]

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Brand & Title — same logo the storefront header uses */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 items-center justify-center rounded-full bg-card px-3 ring-1 ring-border shadow-xs">
          {content.branding?.logoLightUrl || content.branding?.logoDarkUrl ? (
            <img
              src={
                theme === 'dark'
                  ? content.branding.logoDarkUrl || content.branding.logoLightUrl
                  : content.branding.logoLightUrl || content.branding.logoDarkUrl
              }
              alt="ALI FLEET"
              className="h-5 w-auto max-w-[92px] object-contain"
            />
          ) : (
            <span className="text-xs font-extrabold tracking-wider text-foreground">
              ALI FLEET
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-bold tracking-tight text-foreground">
              {t.brand}
            </span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase">
              CMS
            </span>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Reset Defaults button */}
        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          title="إعادة ضبط المحتوى للأصل"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>إعادة ضبط</span>
        </button>

        {/* View Live Site */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-accent/50 shadow-xs"
        >
          <ExternalLink className="h-3.5 w-3.5 text-accent" />
          <span className="hidden sm:inline">{t.header.viewSite}</span>
        </a>

        {/* Language Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Globe className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs">{currentLang.flag}</span>
            <span className="hidden sm:inline text-xs">{currentLang.label}</span>
          </button>

          {langMenuOpen && (
            <div className="absolute top-full mt-1.5 end-0 z-50 w-36 rounded-2xl border border-border bg-card p-1 shadow-lg animate-in fade-in zoom-in-95">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLocale(lang.code)
                    setLangMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                    locale === lang.code
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary hover:text-accent"
          title={theme === 'dark' ? t.header.themeLight : t.header.themeDark}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-accent" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </button>

        {/* Lock / Logout Button */}
        <button
          type="button"
          onClick={() => {
            try {
              window.sessionStorage.removeItem('alifleet_admin_auth')
              window.location.reload()
            } catch {}
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
          title="قفل لوحة التحكم وتسجيل الخروج"
        >
          <ShieldAlert className="h-4 w-4" />
        </button>

        {/* Save All Changes Button — same pill language as the storefront CTAs */}
        <button
          type="button"
          onClick={saveAll}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background shadow-md shadow-foreground/10 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              <span>{t.header.saving}</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>{t.header.saveAll}</span>
            </>
          )}
        </button>
      </div>

      {/* Maintenance Mode Alert Banner if Enabled */}
      {content.maintenance?.enabled && (
        <div className="absolute top-full inset-x-0 bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 animate-bounce" />
            <span>
              {locale === 'ar'
                ? 'تنبيه إداري: وضع الصيانة مفعّل حالياً! الموقع متوقف عن العمل ومحجوب عن الزوار.'
                : 'Notice: Maintenance Mode is active! Public visitors see the maintenance screen.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              updateContent((prev) => ({
                ...prev,
                maintenance: { ...prev.maintenance, enabled: false },
              }))
            }}
            className="rounded-lg bg-zinc-950 px-3 py-1 text-[11px] font-bold text-amber-400 hover:bg-zinc-900 transition-colors"
          >
            {locale === 'ar' ? 'إيقاف وضع الصيانة والفتح للعامة' : 'Disable Maintenance Now'}
          </button>
        </div>
      )}

      {/* Reset confirmation modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold">تأكيد استعادة الإعدادات الأصلية</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              سيتم استعادة جميع محتويات الموقع، السيارات، قطع الغيار، ومقالات المدونة إلى حالتها الأصلية الأولى. هل تريد المتابعة؟
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDefaults()
                  setResetConfirmOpen(false)
                }}
                className="rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
