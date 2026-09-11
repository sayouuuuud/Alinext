'use client'

import { ArrowRight, Bell, CheckCircle2, MapPin, Package, UserRound } from 'lucide-react'
import LocaleLink from '@/components/locale-link'
import { useLanguage } from '@/lib/i18n/language-context'
import type { Customer, Viewer } from '@/lib/auth/types'
import type { TrackingOrder } from '@/lib/commerce/types'
import type { AccountNotification } from '@/lib/notifications/queries'
import { isActiveOrder } from '@/lib/orders/status'
import { notificationText } from './notification-center'
import { OrderCard } from './order-card'

export function DashboardView({ customer, viewer, orders, notifications, unreadCount }: { customer: Customer; viewer: Viewer; orders: TrackingOrder[]; notifications: AccountNotification[]; unreadCount: number }) {
  const { locale } = useLanguage()
  const ar = locale === 'ar'
  const displayName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.displayName || viewer.username
  const active = orders.filter((order) => isActiveOrder(order.status))
  const completed = orders.filter((order) => order.status === 'completed')
  const defaultAddress = customer.shipping.address1 ? `${customer.shipping.address1}، ${customer.shipping.city}` : ar ? 'لم يُضف بعد' : 'Not added yet'
  const latestActive = active[0]
  const cards = [
    { label: ar ? 'طلبات نشطة' : 'Active orders', value: active.length, Icon: Package },
    { label: ar ? 'طلبات مكتملة' : 'Completed orders', value: completed.length, Icon: CheckCircle2 },
    { label: ar ? 'إشعارات جديدة' : 'New notifications', value: unreadCount, Icon: Bell },
  ]
  const quick = [
    { href: '/account/orders', label: ar ? 'الطلبات' : 'Orders', Icon: Package },
    { href: '/account/notifications', label: ar ? 'الإشعارات' : 'Notifications', Icon: Bell },
    { href: '/account/profile', label: ar ? 'الملف الشخصي' : 'Profile', Icon: UserRound },
    { href: '/account/addresses', label: ar ? 'العناوين' : 'Addresses', Icon: MapPin },
  ]

  return <div className="flex flex-col gap-9"><header><p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">ALI FLEET ACCOUNT</p><h1 className="mt-4 text-balance font-serif text-4xl leading-tight tracking-tight md:text-5xl">{ar ? `مرحبًا، ${displayName}` : `Welcome, ${displayName}`}</h1><p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">{ar ? 'كل ما تحتاجه لمتابعة طلباتك في مكان واحد وواضح.' : 'Everything you need to follow your orders in one clear place.'}</p></header><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, Icon }) => <div key={label} className="rounded-3xl bg-card p-5 ring-1 ring-border"><Icon className="size-5 text-accent" /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p></div>)}<div className="rounded-3xl bg-card p-5 ring-1 ring-border"><MapPin className="size-5 text-accent" /><p className="mt-4 text-xs text-muted-foreground">{ar ? 'العنوان الافتراضي' : 'Default address'}</p><p className="mt-1 truncate text-sm font-semibold">{defaultAddress}</p></div></section>{latestActive ? <section><div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-serif text-2xl">{ar ? 'آخر طلب نشط' : 'Latest active order'}</h2></div><OrderCard order={latestActive} /></section> : null}<section className="grid gap-6 lg:grid-cols-2"><div><div className="flex items-center justify-between gap-4"><h2 className="font-serif text-2xl">{ar ? 'أحدث الإشعارات' : 'Latest notifications'}</h2><LocaleLink href="/account/notifications" className="text-sm font-semibold text-accent hover:underline">{ar ? 'عرض الكل' : 'View all'}</LocaleLink></div><div className="mt-4 flex flex-col gap-3">{notifications.length ? notifications.slice(0, 3).map((notification) => <LocaleLink key={notification.id} href={notification.orderId ? `/account/orders/${notification.orderId}` : '/account/notifications'} className="rounded-2xl bg-card p-4 text-sm ring-1 ring-border hover:bg-secondary"><span className="font-semibold">{notificationText(notification, locale)}</span><time className="mt-1 block text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString(ar ? 'ar' : locale)}</time></LocaleLink>) : <div className="rounded-2xl bg-card p-5 text-sm text-muted-foreground ring-1 ring-border">{ar ? 'لا توجد إشعارات بعد.' : 'No notifications yet.'}</div>}</div></div><div><h2 className="font-serif text-2xl">{ar ? 'روابط سريعة' : 'Quick links'}</h2><div className="mt-4 grid grid-cols-2 gap-3">{quick.map(({ href, label, Icon }) => <LocaleLink key={href} href={href} className="group rounded-2xl bg-card p-4 ring-1 ring-border hover:bg-secondary"><Icon className="size-5 text-accent" /><span className="mt-3 flex items-center justify-between gap-2 text-sm font-semibold">{label}<ArrowRight className="size-4 rtl:rotate-180" /></span></LocaleLink>)}</div></div></section></div>
}
