'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getStoredContent,
  saveContent as persistContent,
  resetToDefault as persistReset,
  exportBackupJson,
  parseAndValidateBackup,
  CONTENT_UPDATE_EVENT,
} from './content-store'
import { adminI18n, type AdminDictionary, type AdminLocale } from './admin-i18n'
import type { SiteFullContent } from './types'

export type AdminTab =
  | 'dashboard'
  | 'pages'
  | 'cars'
  | 'products'
  | 'blog'
  | 'orders'
  | 'customers'
  | 'settings'

export type AdminTheme = 'dark' | 'light'

type ToastMessage = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

type AdminContextType = {
  locale: AdminLocale
  setLocale: (loc: AdminLocale) => void
  t: AdminDictionary
  dir: 'rtl' | 'ltr'
  theme: AdminTheme
  setTheme: (th: AdminTheme) => void
  toggleTheme: () => void
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  content: SiteFullContent
  updateContent: (updater: (prev: SiteFullContent) => SiteFullContent) => void
  saveAll: () => boolean
  isSaving: boolean
  changePassword: (oldPass: string, newPass: string) => boolean
  resetDefaults: () => void
  exportBackup: () => void
  importBackup: (jsonStr: string) => boolean
  toasts: ToastMessage[]
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>('ar')
  const [theme, setThemeState] = useState<AdminTheme>('dark')
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [content, setContent] = useState<SiteFullContent>(getStoredContent)
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // Load user preferences for admin theme & locale
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('alifleet_admin_theme') as AdminTheme | null
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme)
      }
      const savedLocale = localStorage.getItem('alifleet_admin_locale') as AdminLocale | null
      if (savedLocale === 'ar' || savedLocale === 'en' || savedLocale === 'he') {
        setLocaleState(savedLocale)
      }
    } catch {
      // ignore
    }
  }, [])

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Sync content updates
  useEffect(() => {
    function handleUpdate(e: Event) {
      const customEvent = e as CustomEvent<SiteFullContent>
      if (customEvent.detail) {
        setContent(customEvent.detail)
      }
    }
    window.addEventListener(CONTENT_UPDATE_EVENT, handleUpdate)
    return () => window.removeEventListener(CONTENT_UPDATE_EVENT, handleUpdate)
  }, [])

  const setLocale = (loc: AdminLocale) => {
    setLocaleState(loc)
    try {
      localStorage.setItem('alifleet_admin_locale', loc)
    } catch {}
  }

  const setTheme = (th: AdminTheme) => {
    setThemeState(th)
    try {
      localStorage.setItem('alifleet_admin_theme', th)
    } catch {}
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const updateContent = (updater: (prev: SiteFullContent) => SiteFullContent) => {
    setContent((prev) => {
      const next = updater(prev)
      persistContent(next)
      return next
    })
  }

  const saveAll = (): boolean => {
    setIsSaving(true)
    const success = persistContent(content)
    setTimeout(() => {
      setIsSaving(false)
      if (success) {
        showToast(adminI18n[locale].header.savedSuccess, 'success')
      } else {
        showToast('Error saving data', 'error')
      }
    }, 400)
    return success
  }

  const resetDefaults = () => {
    const fresh = persistReset()
    setContent(fresh)
    showToast('Reset to factory defaults successfully', 'info')
  }

  const exportBackup = () => {
    exportBackupJson(content)
    showToast('Backup JSON downloaded', 'success')
  }

  const importBackup = (jsonStr: string): boolean => {
    const parsed = parseAndValidateBackup(jsonStr)
    if (!parsed) {
      showToast('Invalid backup JSON format', 'error')
      return false
    }
    setContent(parsed)
    persistContent(parsed)
    showToast('Backup restored successfully!', 'success')
    return true
  }

  const changePassword = (oldPass: string, newPass: string): boolean => {
    const currentPass = content.security?.passwordHash || 'alifleet2026'
    if (oldPass !== currentPass) {
      showToast(adminI18n[locale].settings.security.wrongPasswordError, 'error')
      return false
    }
    if (!newPass || newPass.length < 6) {
      showToast(adminI18n[locale].settings.security.passwordEmptyError, 'error')
      return false
    }

    updateContent((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        passwordHash: newPass,
        lastPasswordChange: new Date().toISOString().slice(0, 10),
      },
    }))
    showToast(adminI18n[locale].settings.security.passwordChangedSuccess, 'success')
    return true
  }

  const dict = adminI18n[locale] || adminI18n.ar

  return (
    <AdminContext.Provider
      value={{
        locale,
        setLocale,
        t: dict,
        dir: dict.dir,
        theme,
        setTheme,
        toggleTheme,
        activeTab,
        setActiveTab,
        content,
        updateContent,
        saveAll,
        isSaving,
        changePassword,
        resetDefaults,
        exportBackup,
        importBackup,
        toasts,
        showToast,
        removeToast,
      }}
    >
      <div className={`${theme} min-h-screen font-sans`} dir={dict.dir}>
        {children}
      </div>
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return ctx
}
