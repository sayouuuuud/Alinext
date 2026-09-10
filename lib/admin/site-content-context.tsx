'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MaintenanceScreen } from '@/components/maintenance-screen'
import { defaultSiteContent } from './default-content'
import type { MultiLangString, SiteFullContent } from './types'
import type { Locale } from '@/lib/i18n/config'

type SiteContentContextValue = {
  content: SiteFullContent
  tStr: (item?: MultiLangString | null, locale?: Locale) => string
}

const SiteContentContext = createContext<SiteContentContextValue>({
  content: defaultSiteContent,
  tStr: (item, locale = 'he') => item?.[locale] || item?.en || item?.ar || item?.he || '',
})

export function SiteContentProvider({ children, initialContent }: { children: React.ReactNode; initialContent?: SiteFullContent }) {
  const [content, setContent] = useState<SiteFullContent>(initialContent ?? defaultSiteContent)
  const pathname = usePathname()

  useEffect(() => {
    if (initialContent) setContent(initialContent)
  }, [initialContent])

  useEffect(() => {
    if (content.branding?.accentColor) document.documentElement.style.setProperty('--primary', content.branding.accentColor)
    if (content.branding?.faviconUrl) {
      const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = content.branding.faviconUrl
      document.head.appendChild(link)
    }
  }, [content.branding])

  const tStr = (item?: MultiLangString | null, locale: Locale = 'he') => item?.[locale] || item?.en || item?.ar || item?.he || ''
  const isMaintenanceActive = Boolean(content.maintenance?.enabled)
  const isPrivateRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/account') || pathname?.startsWith('/auth')

  return (
    <SiteContentContext.Provider value={{ content, tStr }}>
      {isMaintenanceActive && !isPrivateRoute ? <MaintenanceScreen /> : children}
    </SiteContentContext.Provider>
  )
}

export function useSiteContent() {
  return useContext(SiteContentContext)
}
