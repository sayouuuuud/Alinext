'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  LOCALE_STORAGE_KEY,
  defaultLocale,
  localeMeta,
  type Locale,
} from './config'
import { parsePublicPathname, toPublicPathname } from './routing'
import { en, type Dictionary } from './dictionaries/en'
import { ar } from './dictionaries/ar'
import { he } from './dictionaries/he'

const dictionaries: Record<Locale, Dictionary> = { ar, en, he }

type LanguageContextValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: Dictionary
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLocale = defaultLocale,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  // The server-selected locale is authoritative. Mirror it into browser
  // storage so private routes retain the last language without overriding a
  // language encoded in an indexed public URL.
  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    const secure = window.location.protocol === 'https:' ? '; secure' : ''
    document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax${secure}`
  }, [locale])

  // Keep <html lang/dir> in sync so native text direction, fonts and
  // logical CSS properties all resolve correctly.
  useEffect(() => {
    const meta = localeMeta[locale]
    document.documentElement.lang = meta.htmlLang
    document.documentElement.dir = meta.dir
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    const secure = window.location.protocol === 'https:' ? '; secure' : ''
    document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax${secure}`

    const publicRoute = parsePublicPathname(window.location.pathname)
    if (publicRoute) {
      const destination = `${toPublicPathname(
        publicRoute.internalPathname,
        next
      )}${window.location.search}${window.location.hash}`
      if (
        destination !==
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      ) {
        router.push(destination)
      }
    }

    setLocaleState(next)
  }, [router])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: localeMeta[locale].dir,
      t: dictionaries[locale],
      setLocale,
    }),
    [locale, setLocale]
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside a LanguageProvider')
  return ctx
}

export { dictionaries }
