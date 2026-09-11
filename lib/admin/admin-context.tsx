'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { defaultSiteContent } from './default-content'
import { adminI18n, type AdminDictionary, type AdminLocale } from './admin-i18n'
import type { SiteFullContent } from './types'
import type { AdminDashboardSummary } from './dashboard-summary-server'

export type AdminTab = 'dashboard' | 'pages' | 'cars' | 'products' | 'categories' | 'blog' | 'orders' | 'inquiries' | 'customers' | 'settings'
export type AdminTheme = 'dark' | 'light'
type ToastMessage = { id: string; message: string; type: 'success' | 'error' | 'info' }
type SaveScope = Exclude<AdminTab, 'dashboard' | 'orders' | 'customers'>

function saveScopeForTab(tab: AdminTab): SaveScope | null {
  if (tab === 'dashboard' || tab === 'orders' || tab === 'customers') return null
  return tab
}

function payloadForScope(scope: SaveScope, content: SiteFullContent): unknown {
  if (scope === 'pages') {
    return {
      pages: content.pages,
      general: {
        contact: content.general.contact,
        social: content.general.social,
        navigation: content.general.navigation,
        footer: content.general.footer,
      },
    }
  }
  if (scope === 'settings') {
    return {
      branding: content.branding,
      commerce: content.commerce,
      seo: content.seo,
      maintenance: content.maintenance,
      notifications: content.notifications,
      security: content.security,
      currency: content.general.currency,
    }
  }
  return content[scope]
}

type AdminContextType = {
  locale: AdminLocale
  setLocale: (loc: AdminLocale) => void
  t: AdminDictionary
  dir: 'rtl' | 'ltr'
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  content: SiteFullContent
  summary: AdminDashboardSummary | null
  updateContent: (updater: (previous: SiteFullContent) => SiteFullContent) => void
  saveAll: () => Promise<boolean>
  persist: (scope: SaveScope, data: unknown) => Promise<boolean>
  deleteResource: (resource: 'car' | 'product' | 'category' | 'blog' | 'customer', id: string) => Promise<{ ok: boolean; error?: string }>
  isSaving: boolean
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  resetDefaults: () => void
  exportBackup: () => void
  importBackup: (json: string) => boolean
  toasts: ToastMessage[]
  showToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: string) => void
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>('ar')
  const [theme, setThemeState] = useState<AdminTheme>('light')
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [content, setContent] = useState<SiteFullContent>(defaultSiteContent)
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const savedTheme = localStorage.getItem('alifleet_admin_theme') as AdminTheme | null
    const savedLocale = localStorage.getItem('alifleet_admin_locale') as AdminLocale | null
    if (savedTheme === 'light' || savedTheme === 'dark') setThemeState(savedTheme)
    if (savedLocale === 'ar' || savedLocale === 'en' || savedLocale === 'he') setLocaleState(savedLocale)
  }, [])

  useEffect(() => {
    async function loadContent() {
      const [contentResponse, summaryResponse] = await Promise.all([
        fetch('/api/admin/content', { cache: 'no-store' }),
        fetch('/api/admin/summary', { cache: 'no-store' }),
      ])
      if (contentResponse.ok) setContent(await contentResponse.json())
      if (summaryResponse.ok) setSummary(await summaryResponse.json())
    }
    loadContent().catch(() => undefined)
    window.addEventListener('alifleet-admin-authenticated', loadContent)
    return () => window.removeEventListener('alifleet-admin-authenticated', loadContent)
  }, [])

  const setLocale = (value: AdminLocale) => { setLocaleState(value); localStorage.setItem('alifleet_admin_locale', value) }
  const setTheme = (value: AdminTheme) => { setThemeState(value); localStorage.setItem('alifleet_admin_theme', value) }
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000)
  }
  const removeToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id))
  const updateContent = (updater: (previous: SiteFullContent) => SiteFullContent) => setContent(updater)

  const refreshSummary = async () => {
    const response = await fetch('/api/admin/summary', { cache: 'no-store' })
    if (response.ok) setSummary(await response.json())
  }

  const persist = async (scope: SaveScope, data: unknown): Promise<boolean> => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, data }),
      })
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'save_failed')
      }
      const result = await response.json()
      setContent((current) => ({ ...current, lastSaved: result.lastSaved || current.lastSaved }))
      await refreshSummary()
      return true
    } catch (error) {
      console.error(`Failed to persist scope ${scope}:`, error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const deleteResource: AdminContextType['deleteResource'] = async (resource, id) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource, id }),
      })
      const payload = await response.json().catch(() => ({ error: 'delete_failed' }))
      if (!response.ok) return { ok: false, error: payload.error }
      await refreshSummary()
      return { ok: true }
    } catch {
      return { ok: false, error: 'delete_failed' }
    }
  }

  const saveAll = async () => {
    const scope = saveScopeForTab(activeTab)
    if (!scope) return true
    const success = await persist(scope, payloadForScope(scope, content))
    if (success) {
      showToast(adminI18n[locale].header.savedSuccess, 'success')
      return true
    } else {
      showToast(locale === 'ar' ? 'تعذر حفظ هذا القسم في قاعدة البيانات، يرجى التحقق من الاتصال.' : 'Could not save this section to the database.', 'error')
      return false
    }
  }

  const resetDefaults = () => {
    setContent(defaultSiteContent)
    const scopes: SaveScope[] = ['pages', 'cars', 'products', 'blog', 'settings']
    Promise.all(scopes.map((scope) => persist(scope, payloadForScope(scope, defaultSiteContent))))
      .then(() => showToast(locale === 'ar' ? 'تمت استعادة محتوى البذرة.' : 'Seed content restored.', 'info'))
      .catch(() => showToast(locale === 'ar' ? 'تعذرت استعادة المحتوى.' : 'Could not restore content.', 'error'))
  }

  const exportBackup = () => {
    const safeBackup = {
      version: content.version, exportedAt: new Date().toISOString(), branding: content.branding,
      commerce: content.commerce, seo: content.seo, maintenance: content.maintenance, general: content.general,
      pages: content.pages, cars: content.cars, products: content.products, blog: content.blog,
    }
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(new Blob([JSON.stringify(safeBackup, null, 2)], { type: 'application/json' }))
    anchor.download = `alifleet-content-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(anchor.href)
    showToast(locale === 'ar' ? 'تم تنزيل نسخة المحتوى دون بيانات شخصية.' : 'Content-only backup downloaded.')
  }

  const importBackup = (json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<SiteFullContent>
      if (!parsed.pages?.home || !Array.isArray(parsed.cars) || !Array.isArray(parsed.products) || !Array.isArray(parsed.blog)) throw new Error('invalid')
      setContent((current) => ({ ...current, ...parsed, security: current.security, notifications: current.notifications, orders: current.orders, customers: current.customers, inquiries: current.inquiries }))
      showToast(locale === 'ar' ? 'تم فحص النسخة. اضغط حفظ لتطبيقها.' : 'Backup validated. Save to apply it.', 'info')
      return true
    } catch {
      showToast(locale === 'ar' ? 'ملف النسخة غير صالح.' : 'Invalid backup file.', 'error')
      return false
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (!data.user?.email || newPassword.length < 8) { showToast(adminI18n[locale].settings.security.passwordEmptyError, 'error'); return false }
    const signIn = await supabase.auth.signInWithPassword({ email: data.user.email, password: oldPassword })
    if (signIn.error) { showToast(adminI18n[locale].settings.security.wrongPasswordError, 'error'); return false }
    const update = await supabase.auth.updateUser({ password: newPassword })
    if (update.error) { showToast(locale === 'ar' ? 'تعذر تحديث كلمة المرور.' : 'Could not update password.', 'error'); return false }
    await fetch('/api/admin/session', { method: 'PATCH' })
    showToast(adminI18n[locale].settings.security.passwordChangedSuccess, 'success')
    return true
  }

  const dictionary = adminI18n[locale] || adminI18n.ar
  return (
    <AdminContext.Provider value={{
      locale, setLocale, t: dictionary, dir: dictionary.dir, theme, setTheme, toggleTheme, activeTab, setActiveTab,
      content, summary, updateContent, saveAll, persist, deleteResource, isSaving, changePassword, resetDefaults, exportBackup, importBackup,
      toasts, showToast, removeToast,
    }}>
      <div className={`${theme} admin-shell min-h-screen font-sans`} dir={dictionary.dir} lang={locale}>{children}</div>
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within an AdminProvider')
  return context
}
