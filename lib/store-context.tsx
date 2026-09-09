'use client'

import { createContext, useContext, useMemo } from 'react'
import { useSiteContent } from '@/lib/admin/site-content-context'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  contentToStoreSettings,
  fallbackSettings,
  type StoreSettings,
} from '@/lib/site-config'

const StoreContext = createContext<StoreSettings>(fallbackSettings)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { content } = useSiteContent()
  const { locale } = useLanguage()
  const settings = useMemo(
    () => contentToStoreSettings(content, locale),
    [content, locale]
  )

  return (
    <StoreContext.Provider value={settings}>{children}</StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
