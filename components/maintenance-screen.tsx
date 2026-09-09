'use client'

import React from 'react'
import {
  Wrench,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useSiteContent } from '@/lib/admin/site-content-context'

export function MaintenanceScreen() {
  const { locale } = useLanguage()
  const lang = locale
  const { content } = useSiteContent()

  const contact = content.general?.contact
  const branding = content.branding
  const maintenance = content.maintenance

  const message =
    maintenance?.message?.[locale] ||
    maintenance?.message?.ar ||
    maintenance?.message?.en ||
    maintenance?.message?.he ||
    (locale === 'ar'
      ? 'الموقع حالياً في وضع الصيانة الدورية وترقية وتحديث الأنظمة لتقديم أفضل تجربة لخدمتكم.'
      : locale === 'he'
      ? 'האתר נמצא כעת במצב תחזוקה שוטפת ושדרוג מערכות כדי לספק לכם את השירות הטוב ביותר.'
      : 'Our website is currently undergoing scheduled maintenance and system upgrades to provide you with the best luxury experience.')

  const phone = contact?.phone || '053-957-3718'
  const whatsapp = contact?.whatsapp || '972539573718'
  const email = contact?.email || 'info@alifleet.com'
  const logo = branding?.logoDarkUrl || branding?.logoLightUrl || '/images/ali-fleet-logo.png'

  return (
    <div className="fixed inset-0 z-[99999] flex min-h-screen flex-col items-center justify-between bg-zinc-950 text-zinc-100 p-6 sm:p-10 selection:bg-amber-500 selection:text-black overflow-y-auto">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-amber-600/15 via-primary/10 to-transparent blur-3xl" />
        <div className="absolute bottom-10 start-10 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Top Bar: Brand & Badge */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="ALI FLEET"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-wider uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>{lang === 'ar' ? 'وضع الصيانة نشط' : lang === 'he' ? 'מצב תחזוקה פעיל' : 'Maintenance Active'}</span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 my-auto max-w-2xl text-center py-10">
        {/* Icon Emblem */}
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl shadow-amber-500/10">
          <Wrench className="size-10 text-amber-400 animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {lang === 'ar'
            ? 'نعمل حالياً على تطوير وتحديث الموقع'
            : lang === 'he'
            ? 'אנו משדרגים את האתר כעת'
            : 'Scheduled System Maintenance'}
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto">
          {message}
        </p>

        {/* Feature status pills */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-start">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase mb-1">
              <Clock className="size-4" />
              <span>{lang === 'ar' ? 'العودة قريباً' : 'Returning Soon'}</span>
            </div>
            <div className="text-sm font-bold text-zinc-200">
              {lang === 'ar' ? 'أعمال الترقية جارية' : 'Upgrade in Progress'}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase mb-1">
              <ShieldCheck className="size-4" />
              <span>{lang === 'ar' ? 'أمان البيانات' : 'Data Integrity'}</span>
            </div>
            <div className="text-sm font-bold text-zinc-200">
              {lang === 'ar' ? 'محمي ومحفوظ 100%' : '100% Protected'}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase mb-1">
              <Sparkles className="size-4" />
              <span>{lang === 'ar' ? 'الدعم الفني' : 'Direct Support'}</span>
            </div>
            <div className="text-sm font-bold text-zinc-200">
              {lang === 'ar' ? 'متاح على مدار الساعة' : '24/7 Available'}
            </div>
          </div>
        </div>

        {/* Emergency Contact CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
              lang === 'ar' ? 'مرحباً علي فليت، أود الاستفسار أثناء وضع الصيانة.' : 'Hello ALI FLEET, inquiry during maintenance.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
          >
            <MessageCircle className="size-4" />
            <span>{lang === 'ar' ? 'محادثة فورية عبر واتساب' : 'WhatsApp Support'}</span>
          </a>

          <a
            href={`tel:${phone}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Phone className="size-4" />
            <span>{phone}</span>
          </a>

          <a
            href={`mailto:${email}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Mail className="size-4" />
            <span>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Us'}</span>
          </a>
        </div>
      </main>

      {/* Footer: Admin Login Shortcut */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-900 pt-6 text-xs text-zinc-500">
        <div>
          © {new Date().getFullYear()} ALI FLEET. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </div>

        <a
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
        >
          <Lock className="size-3 text-amber-500" />
          <span>{lang === 'ar' ? 'دخول الإدارة (Admin Login)' : 'Admin Control Panel'}</span>
          <ArrowRight className="size-3" />
        </a>
      </footer>
    </div>
  )
}
