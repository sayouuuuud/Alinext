'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { fallbackSettings, type StoreSettings } from '@/lib/site-config'
import { getStoredContent, CONTENT_UPDATE_EVENT } from '@/lib/admin/content-store'

/**
 * Makes the store settings — phone, address, currency, cart URL —
 * available to client components.
 *
 * It seamlessly synchronizes with live settings changed in the Admin panel!
 */

const StoreContext = createContext<StoreSettings>(fallbackSettings)

export function StoreProvider({
  settings,
  children,
}: {
  settings: StoreSettings
  children: React.ReactNode
}) {
  const [currentSettings, setCurrentSettings] = useState<StoreSettings>(settings)

  useEffect(() => {
    function syncFromAdmin() {
      try {
        const stored = getStoredContent()
        if (stored) {
          const contact = stored.general?.contact
          const commerce = stored.commerce
          const social = stored.general?.social

          setCurrentSettings((prev) => {
            const phoneVal = contact?.phone || prev.phone
            const whatsappVal = contact?.whatsapp || prev.whatsapp
            const emailVal = contact?.email || prev.email
            const currencyVal = commerce?.currencySymbol || commerce?.currency || stored.general?.currency || prev.currency

            return {
              ...prev,
              name: stored.branding?.tagline?.ar || prev.name,
              phone: phoneVal,
              phoneHref: phoneVal ? `tel:${phoneVal.replace(/[^0-9+]/g, '')}` : prev.phoneHref,
              whatsapp: whatsappVal,
              email: emailVal,
              addressLines: contact?.address
                ? [contact.address.ar || contact.address.en || contact.address.he || '']
                : prev.addressLines,
              hours: contact?.hours
                ? contact.hours.ar || contact.hours.en || contact.hours.he || ''
                : prev.hours,
              currency: currencyVal,
              social: {
                instagram: social?.instagram ?? prev.social.instagram,
                facebook: social?.facebook ?? prev.social.facebook,
                linkedin: social?.linkedin ?? prev.social.linkedin,
              },
            }
          })
        }
      } catch {}
    }

    // Sync on initial mount
    syncFromAdmin()

    window.addEventListener(CONTENT_UPDATE_EVENT, syncFromAdmin)
    return () => window.removeEventListener(CONTENT_UPDATE_EVENT, syncFromAdmin)
  }, [])

  return (
    <StoreContext.Provider value={currentSettings}>{children}</StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
