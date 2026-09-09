'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { defaultSiteContent } from './default-content'
import { getStoredContent, CONTENT_UPDATE_EVENT, CONTENT_STORAGE_KEY } from './content-store'
import type { MultiLangString, SiteFullContent } from './types'
import type { Locale } from '@/lib/i18n/config'

import { usePathname } from 'next/navigation'
import { MaintenanceScreen } from '@/components/maintenance-screen'

type SiteContentContextValue = {
  content: SiteFullContent
  tStr: (item?: MultiLangString | null, locale?: Locale) => string
}

const SiteContentContext = createContext<SiteContentContextValue>({
  content: defaultSiteContent,
  tStr: (item, locale = 'he') => item?.[locale] || item?.en || item?.ar || item?.he || '',
})

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteFullContent>(getStoredContent)
  const pathname = usePathname()

  useEffect(() => {
    // Initial client mount read
    const stored = getStoredContent()
    setContent(stored)

    // Sync with server API
    fetch('/api/admin/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.version === 5 && data.pages) {
          const raw = window.localStorage.getItem(CONTENT_STORAGE_KEY)
          if (!raw) {
            window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(data))
            setContent(data)
          } else {
            try {
              const currentLocal = JSON.parse(raw)
              if (new Date(data.lastSaved || 0).getTime() > new Date(currentLocal.lastSaved || 0).getTime()) {
                window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(data))
                setContent(data)
              }
            } catch {}
          }
        }
      })
      .catch(() => {})

    function handleUpdate(e: Event) {
      const customEvent = e as CustomEvent<SiteFullContent>
      if (customEvent.detail) {
        setContent(customEvent.detail)
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === CONTENT_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as SiteFullContent
          if (parsed && parsed.version === 5) {
            setContent(parsed)
          }
        } catch {}
      }
    }

    window.addEventListener(CONTENT_UPDATE_EVENT, handleUpdate)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(CONTENT_UPDATE_EVENT, handleUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Apply dynamic branding (accent color & favicon)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Accent color
    if (content.branding?.accentColor) {
      document.documentElement.style.setProperty('--primary', content.branding.accentColor)
    }

    // 2. Favicon
    if (content.branding?.faviconUrl) {
      const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = content.branding.faviconUrl
      document.getElementsByTagName('head')[0]?.appendChild(link)
    }
  }, [content.branding])

  const tStr = (item?: MultiLangString | null, locale: Locale = 'he'): string => {
    if (!item) return ''
    return item[locale] || item.en || item.ar || item.he || ''
  }

  // Check if maintenance mode is enabled and current route is not admin
  const isMaintenanceActive = Boolean(content.maintenance?.enabled)
  const isAdminRoute = pathname ? pathname.startsWith('/admin') : false

  return (
    <SiteContentContext.Provider value={{ content, tStr }}>
      {isMaintenanceActive && !isAdminRoute ? <MaintenanceScreen /> : children}
    </SiteContentContext.Provider>
  )
}

export function useSiteContent() {
  return useContext(SiteContentContext)
}
