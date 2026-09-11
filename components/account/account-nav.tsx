'use client'

import { usePathname } from 'next/navigation'
import { Bell, LayoutGrid, MapPin, Package, UserRound } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { useLanguage } from '@/lib/i18n/language-context'
import { LogoutButton } from './logout-button'

export function AccountNav() {
  const { locale } = useLanguage()
  const pathname = usePathname()
  const ar = locale === 'ar'
  const items = [
    { href: '/account', label: ar ? 'نظرة عامة' : 'Overview', Icon: LayoutGrid },
    { href: '/account/orders', label: ar ? 'الطلبات' : 'Orders', Icon: Package },
    { href: '/account/notifications', label: ar ? 'الإشعارات' : 'Notifications', Icon: Bell },
    { href: '/account/profile', label: ar ? 'الملف الشخصي' : 'Profile', Icon: UserRound },
    { href: '/account/addresses', label: ar ? 'العناوين' : 'Addresses', Icon: MapPin },
  ]
  return <nav aria-label={ar ? 'حسابي' : 'My account'} className="flex flex-col gap-2">{items.map(({ href, label, Icon }) => { const active = href === '/account' ? pathname === href : pathname.startsWith(href); return <LocaleLink key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><Icon className="size-4 shrink-0" />{label}</LocaleLink> })}<div className="mt-2 border-t border-border pt-2"><LogoutButton /></div></nav>
}
