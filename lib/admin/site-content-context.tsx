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

export function SiteContentProvider({
  children,
  initialContent,
}: {
  children: React.ReactNode
  initialContent?: SiteFullContent
}) {
  // Initialize with the server-rendered content so the client's first render
  // matches the server HTML exactly — reading localStorage here instead would
  // produce a hydration mismatch whenever the saved copy differs. localStorage
  // and the shared file are reconciled after mount below.
  const [content, setContent] = useState<SiteFullContent>(initialContent ?? defaultSiteContent)
  const pathname = usePathname()

  useEffect(() => {
    const isNewer = (a?: string, b?: string) =>
      new Date(a || 0).getTime() > new Date(b || 0).getTime()

    let current = initialContent ?? defaultSiteContent

    // Adopt a locally-stored copy only when it is newer than what the server
    // sent (e.g. the admin edited content on this device).
    const raw = window.localStorage.getItem(CONTENT_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SiteFullContent
        if (parsed?.version === 5 && parsed?.pages && isNewer(parsed.lastSaved, current.lastSaved)) {
          current = parsed
          setContent(parsed)
        }
      } catch {}
    }

    // Reconcile with the shared server file (the cross-device source of truth).
    fetch('/api/admin/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.version === 5 && data.pages && isNewer(data.lastSaved, current.lastSaved)) {
          window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(data))
          setContent(data)
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
    // initialContent is provided once by the server layout and stable for the
    // lifetime of this root provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
