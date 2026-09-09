import type { SiteFullContent } from '@/lib/admin/types'
import type { Locale } from '@/lib/i18n/config'

export type StoreSettings = {
  name: string
  phone: string
  phoneHref: string
  whatsapp: string
  email: string
  addressLines: string[]
  hours: string
  social: { instagram: string; facebook: string; linkedin: string }
  currency: string
}

export const fallbackSettings: StoreSettings = {
  name: 'ALI FLEET',
  phone: '',
  phoneHref: '',
  whatsapp: '',
  email: '',
  addressLines: [],
  hours: '',
  social: { instagram: '', facebook: '', linkedin: '' },
  currency: '₪',
}

export const siteConfig = fallbackSettings

export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

export function whatsappLink(message: string, whatsapp: string) {
  const digits = whatsapp.replace(/\D+/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function contentToStoreSettings(
  content: SiteFullContent,
  locale: Locale = 'he'
): StoreSettings {
  const contact = content.general.contact
  const address = contact.address[locale] || contact.address.en || contact.address.ar || ''
  const hours = contact.hours[locale] || contact.hours.en || contact.hours.ar || ''

  return {
    name: contact.companyName || 'ALI FLEET',
    phone: contact.phone,
    phoneHref: telHref(contact.phone),
    whatsapp: contact.whatsapp.replace(/\D+/g, ''),
    email: contact.email,
    addressLines: address
      .split(/\n|،|,/)
      .map((line) => line.trim())
      .filter(Boolean),
    hours,
    social: {
      instagram: content.general.social.instagram,
      facebook: content.general.social.facebook,
      linkedin: content.general.social.linkedin,
    },
    currency: content.general.currency || '₪',
  }
}
