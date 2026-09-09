import { defaultSiteContent } from './default-content'
import type { SiteFullContent } from './types'

export const CONTENT_STORAGE_KEY = 'alifleet_site_content_v5'
export const CONTENT_UPDATE_EVENT = 'alifleet-content-updated'

export function getStoredContent(): SiteFullContent {
  if (typeof window === 'undefined') {
    return defaultSiteContent
  }

  try {
    const raw = window.localStorage.getItem(CONTENT_STORAGE_KEY)
    if (!raw) return defaultSiteContent
    const parsed = JSON.parse(raw) as SiteFullContent
    if (!parsed || !parsed.pages || !parsed.cars || !parsed.orders || parsed.version !== 5) {
      return defaultSiteContent
    }
    return parsed
  } catch (err) {
    console.warn('Failed to load stored site content, using defaults:', err)
    return defaultSiteContent
  }
}

export function saveContent(content: SiteFullContent): boolean {
  if (typeof window === 'undefined') return false

  try {
    const payload: SiteFullContent = {
      ...content,
      version: 5,
      lastSaved: new Date().toISOString(),
    }
    window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(payload))
    try {
      const isMaint = Boolean(payload.maintenance?.enabled)
      document.cookie = `alifleet_maintenance=${isMaint ? 'true' : 'false'}; path=/; max-age=31536000; SameSite=Lax`
    } catch {}
    window.dispatchEvent(new CustomEvent(CONTENT_UPDATE_EVENT, { detail: payload }))

    // Background sync to server API
    fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((apiErr) => {
      console.warn('Background sync to /api/admin/content failed:', apiErr)
    })

    return true
  } catch (err) {
    console.error('Failed to save site content to localStorage:', err)
    return false
  }
}

export function resetToDefault(): SiteFullContent {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CONTENT_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(CONTENT_UPDATE_EVENT, { detail: defaultSiteContent }))
    fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultSiteContent),
    }).catch(() => {})
  }
  return defaultSiteContent
}

export function exportBackupJson(content: SiteFullContent) {
  if (typeof window === 'undefined') return
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute(
    'download',
    `alifleet-backup-${new Date().toISOString().slice(0, 10)}.json`
  )
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

export function parseAndValidateBackup(jsonStr: string): SiteFullContent | null {
  try {
    const parsed = JSON.parse(jsonStr) as SiteFullContent
    if (!parsed.pages?.home?.hero || !Array.isArray(parsed.cars)) {
      throw new Error('Invalid backup file structure')
    }
    return parsed
  } catch {
    return null
  }
}
