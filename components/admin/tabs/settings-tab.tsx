'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  CreditCard,
  Palette,
  Bell,
  BarChart,
  HardHat,
  Database,
  KeyRound,
  Lock,
  Mail,
  User,
  Save,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import { MultiLangInput } from '../multilang-input'
import { ImageUpload } from '@/components/admin/image-upload'

type SettingsSubTab =
  | 'security'
  | 'commerce'
  | 'branding'
  | 'notifications'
  | 'seo'
  | 'maintenance'
  | 'backup'

export function SettingsTab() {
  const {
    t,
    locale,
    content,
    updateContent,
    saveAll,
    changePassword,
    exportBackup,
    importBackup,
    resetDefaults,
    showToast,
  } = useAdmin()

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('security')

  // Change password form state
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passError, setPassError] = useState('')

  // Backup restore state
  const [importJsonText, setImportJsonText] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const security = content.security || {
    username: 'admin',
    email: 'admin@alifleet.com',
    passwordHash: 'alifleet2026',
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 60,
    lastPasswordChange: '2026-02-15',
  }

  const commerce = content.commerce || {
    currency: '₪',
    currencyPosition: 'after',
    taxRatePercent: 17,
    freeShippingThreshold: 5000,
    enableCardPayment: true,
    enablePaypal: true,
    enableBankWire: true,
    enableCashOnDelivery: true,
    enableWhatsappOrder: true,
  }

  const branding = content.branding || {
    logoLightUrl: '/images/fleet-truck.png',
    logoDarkUrl: '/images/fleet-truck.png',
    faviconUrl: '/icon.png',
    tagline: { ar: 'الفخامة المطلقة في عالم السيارات', en: 'The Pinnacle of Automotive Luxury', he: 'פסגת היוקרה בעולם הרכב' },
    accentColor: '#0ea5e9',
  }

  const notifications = content.notifications || {
    adminAlertEmail: 'orders@alifleet.com',
    whatsappAlertNumber: '972501234567',
    soundAlerts: true,
    autoReplyEmail: true,
  }

  const seo = content.seo || {
    googleAnalyticsId: 'G-ALIFLEET2026',
    metaPixelId: '109827364512',
    searchConsoleTag: '',
    defaultMetaTitle: { ar: 'علي فليت', en: 'ALI FLEET', he: 'אלי פליט' },
    defaultMetaDescription: { ar: '', en: '', he: '' },
  }

  const maintenance = content.maintenance || {
    enabled: false,
    message: { ar: 'الموقع في وضع الصيانة حالياً', en: 'Site under maintenance', he: 'האתר במצב תחזוקה' },
    allowedIps: '127.0.0.1',
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')

    if (newPass !== confirmPass) {
      setPassError(t.settings.security.passwordMismatchError)
      showToast(t.settings.security.passwordMismatchError, 'error')
      return
    }

    const success = await changePassword(currentPass, newPass)
    if (success) {
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
    }
  }

  const handleExecuteImport = () => {
    if (!importJsonText.trim()) return
    const ok = importBackup(importJsonText)
    if (ok) {
      setShowImportModal(false)
      setImportJsonText('')
    }
  }

  const subtabs = [
    { id: 'security', label: t.settings.subtabs.security, icon: KeyRound },
    { id: 'commerce', label: t.settings.subtabs.commerce, icon: CreditCard },
    { id: 'branding', label: t.settings.subtabs.branding, icon: Palette },
    { id: 'notifications', label: t.settings.subtabs.notifications, icon: Bell },
    { id: 'seo', label: t.settings.subtabs.seo, icon: BarChart },
    { id: 'maintenance', label: t.settings.subtabs.maintenance, icon: HardHat },
    { id: 'backup', label: t.settings.subtabs.backup, icon: Database },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.settings.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.settings.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Save className="h-4 w-4" />
          <span>{t.header.saveAll}</span>
        </button>
      </div>

      {/* Subtabs Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-border bg-card rounded-2xl p-1.5">
        {subtabs.map((sub) => {
          const Icon = sub.icon
          const isSelected = activeSubTab === sub.id
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubTab(sub.id as SettingsSubTab)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{sub.label}</span>
            </button>
          )
        })}
      </div>

      {/* 1. SECURITY & PASSWORD SUBTAB */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Password Change Box */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/70 pb-3">
              <KeyRound className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  {t.settings.security.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t.settings.security.subtitle}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-3.5 pt-1">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t.settings.security.currentPassword} *
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t.settings.security.newPassword} *
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="لا تقل عن 6 خانات"
                    className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t.settings.security.confirmPassword} *
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                    className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {passError && (
                <p className="text-xs font-semibold text-destructive">{passError}</p>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t.settings.security.changePasswordBtn}</span>
              </button>
            </form>
          </div>

          {/* Admin Account Settings */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/70 pb-3">
              بيانات حساب الإدارة والتحقق
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t.settings.security.usernameLabel}
                </label>
                <div className="relative mt-1">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={security.username}
                    onChange={(e) =>
                      updateContent((prev) => ({
                        ...prev,
                        security: { ...prev.security, username: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t.settings.security.adminEmailLabel}
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    value={security.email}
                    onChange={(e) =>
                      updateContent((prev) => ({
                        ...prev,
                        security: { ...prev.security, email: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              {/* Session timeout */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t.settings.security.sessionTimeoutLabel}
                </label>
                <select
                  value={security.sessionTimeoutMinutes}
                  onChange={(e) =>
                    updateContent((prev) => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        sessionTimeoutMinutes: Number(e.target.value),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden"
                >
                  <option value={15}>{t.settings.security.min15}</option>
                  <option value={30}>{t.settings.security.min30}</option>
                  <option value={60}>{t.settings.security.hour1}</option>
                  <option value={1440}>{t.settings.security.day1}</option>
                </select>
              </div>

              {/* 2FA Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {t.settings.security.twoFactorTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.settings.security.twoFactorDesc}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={security.twoFactorEnabled}
                  onChange={(e) =>
                    updateContent((prev) => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        twoFactorEnabled: e.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMMERCE & PAYMENTS */}
      {activeSubTab === 'commerce' && (
        <div className="space-y-6 rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground">
              {t.settings.commerce.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.settings.commerce.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.commerce.currencyLabel}
              </label>
              <input
                type="text"
                value={commerce.currency}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    commerce: { ...prev.commerce, currency: e.target.value },
                    general: { ...prev.general, currency: e.target.value },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.commerce.currencyPosLabel}
              </label>
              <select
                value={commerce.currencyPosition}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    commerce: {
                      ...prev.commerce,
                      currencyPosition: e.target.value as any,
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="after">{t.settings.commerce.posAfter}</option>
                <option value="before">{t.settings.commerce.posBefore}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.commerce.taxRateLabel}
              </label>
              <input
                type="number"
                value={commerce.taxRatePercent}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    commerce: {
                      ...prev.commerce,
                      taxRatePercent: Number(e.target.value),
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.commerce.freeShippingLabel} (₪)
              </label>
              <input
                type="number"
                value={commerce.freeShippingThreshold}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    commerce: {
                      ...prev.commerce,
                      freeShippingThreshold: Number(e.target.value),
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border/70 space-y-3">
            <h3 className="text-xs font-bold text-foreground">
              {t.settings.commerce.paymentMethodsTitle}
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {[
                { key: 'enableCardPayment', label: t.settings.commerce.cardPayment },
                { key: 'enablePaypal', label: t.settings.commerce.paypal },
                { key: 'enableBankWire', label: t.settings.commerce.bankWire },
                { key: 'enableCashOnDelivery', label: t.settings.commerce.cashOnDelivery },
                { key: 'enableWhatsappOrder', label: t.settings.commerce.whatsappCheckout },
              ].map((method) => (
                <div
                  key={method.key}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3"
                >
                  <span className="text-xs font-semibold text-foreground">
                    {method.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean((commerce as any)[method.key])}
                    onChange={(e) =>
                      updateContent((prev) => ({
                        ...prev,
                        commerce: {
                          ...prev.commerce,
                          [method.key]: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. BRANDING & ASSETS */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6 rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground">
              {t.settings.branding.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.settings.branding.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ImageUpload
              label={t.settings.branding.logoLight}
              value={branding.logoLightUrl}
              onChange={(url) =>
                updateContent((prev) => ({
                  ...prev,
                  branding: { ...prev.branding, logoLightUrl: url },
                }))
              }
              aspectHint="شعار الوضع الفاتح"
            />

            <ImageUpload
              label={t.settings.branding.logoDark}
              value={branding.logoDarkUrl}
              onChange={(url) =>
                updateContent((prev) => ({
                  ...prev,
                  branding: { ...prev.branding, logoDarkUrl: url },
                }))
              }
              aspectHint="شعار الوضع الداكن"
            />

            <ImageUpload
              label={t.settings.branding.favicon}
              value={branding.faviconUrl}
              onChange={(url) =>
                updateContent((prev) => ({
                  ...prev,
                  branding: { ...prev.branding, faviconUrl: url },
                }))
              }
              aspectHint="أيقونة المتصفح Favicon"
            />
          </div>

          <MultiLangInput
            label={t.settings.branding.tagline}
            value={branding.tagline}
            onChange={(v) =>
              updateContent((prev) => ({
                ...prev,
                branding: { ...prev.branding, tagline: v },
              }))
            }
          />
        </div>
      )}

      {/* 4. NOTIFICATIONS */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6 rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground">
              {t.settings.notifications.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.settings.notifications.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.notifications.alertEmail}
              </label>
              <input
                type="email"
                value={notifications.adminAlertEmail}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      adminAlertEmail: e.target.value,
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.notifications.alertWhatsapp}
              </label>
              <input
                type="text"
                value={notifications.whatsappAlertNumber}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      whatsappAlertNumber: e.target.value,
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
              <span className="text-xs font-semibold text-foreground">
                {t.settings.notifications.soundAlerts}
              </span>
              <input
                type="checkbox"
                checked={notifications.soundAlerts}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      soundAlerts: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
              <span className="text-xs font-semibold text-foreground">
                {t.settings.notifications.autoReply}
              </span>
              <input
                type="checkbox"
                checked={notifications.autoReplyEmail}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      autoReplyEmail: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. SEO & ANALYTICS */}
      {activeSubTab === 'seo' && (
        <div className="space-y-6 rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground">
              {t.settings.seo.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.settings.seo.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.seo.ga4}
              </label>
              <input
                type="text"
                value={seo.googleAnalyticsId}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, googleAnalyticsId: e.target.value },
                  }))
                }
                placeholder="G-XXXXXXX"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.seo.pixel}
              </label>
              <input
                type="text"
                value={seo.metaPixelId}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, metaPixelId: e.target.value },
                  }))
                }
                placeholder="Pixel ID"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {t.settings.seo.searchConsole}
              </label>
              <input
                type="text"
                value={seo.searchConsoleTag}
                onChange={(e) =>
                  updateContent((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, searchConsoleTag: e.target.value },
                  }))
                }
                placeholder="google-site-verification=..."
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <MultiLangInput
            label={t.settings.seo.defaultTitle}
            value={seo.defaultMetaTitle}
            onChange={(v) =>
              updateContent((prev) => ({
                ...prev,
                seo: { ...prev.seo, defaultMetaTitle: v },
              }))
            }
          />

          <MultiLangInput
            label={t.settings.seo.defaultDesc}
            value={seo.defaultMetaDescription}
            onChange={(v) =>
              updateContent((prev) => ({
                ...prev,
                seo: { ...prev.seo, defaultMetaDescription: v },
              }))
            }
            textarea
            rows={3}
          />
        </div>
      )}

      {/* 6. MAINTENANCE MODE */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-6 rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
          <div className="border-b border-border/70 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {t.settings.maintenance.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t.settings.maintenance.subtitle}
              </p>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/40 transition-all self-start sm:self-auto shadow-2xs"
            >
              <ExternalLink className="size-3.5 text-primary" />
              <span>{maintenance.enabled ? 'معاينة شاشة الصيانة كما يراها الزائر' : 'معاينة الموقع الحي'}</span>
            </a>
          </div>

          {/* Real-time Status Card */}
          <div
            className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              maintenance.enabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  maintenance.enabled
                    ? 'bg-amber-500 text-zinc-950 animate-pulse'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                <HardHat className="size-6" />
              </div>
              <div>
                <div className="text-sm font-bold">
                  {maintenance.enabled
                    ? 'وضع الصيانة مُفعّل: الموقع متوقف أمام كافة الزوا��'
                    : 'الموقع مفتوح ونشط: متاح لكافة الزوار والعملاء الآن'}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {maintenance.enabled
                    ? 'يتم عرض شاشة الصيانة المخصصة مع قنوات الاتصال والواتساب، ويمكنك تصفح لوحة الأدمن فقط.'
                    : 'المتجر والمعرض يعملان بكامل طاقتهما دون أي حجب أو قيود.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const newEnabled = !maintenance.enabled
                updateContent((prev) => ({
                  ...prev,
                  maintenance: { ...prev.maintenance, enabled: newEnabled },
                }))
                showToast(
                  newEnabled
                    ? (locale === 'ar' ? 'تم تفعيل وضع الصيانة بنجاح! الموقع متوقف أمام الزوار.' : 'Maintenance mode enabled!')
                    : (locale === 'ar' ? 'تم إيقاف وضع الصيانة بنجاح! الموقع متاح للجميع الآن.' : 'Maintenance mode disabled!'),
                  newEnabled ? 'info' : 'success'
                )
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto ${
                maintenance.enabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
              }`}
            >
              {maintenance.enabled ? 'إيقاف وضع الصيانة (فتح الموقع)' : 'تفعيل وضع الصيانة الفوري'}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-4">
            <div>
              <p className="text-xs font-bold text-foreground">
                {t.settings.maintenance.enableMaintenance}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t.settings.maintenance.maintenanceWarning}
              </p>
            </div>
            <input
              type="checkbox"
              checked={maintenance.enabled}
              onChange={(e) => {
                const newEnabled = e.target.checked
                updateContent((prev) => ({
                  ...prev,
                  maintenance: { ...prev.maintenance, enabled: newEnabled },
                }))
                showToast(
                  newEnabled
                    ? (locale === 'ar' ? 'تم تفعيل وضع الصيانة! تم إيقاف الموقع للزوار.' : 'Maintenance Mode Enabled!')
                    : (locale === 'ar' ? 'تم إيقاف وضع الصيانة! الموقع متاح للزوار الآن.' : 'Maintenance Mode Disabled!'),
                  newEnabled ? 'info' : 'success'
                )
              }}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <MultiLangInput
            label={t.settings.maintenance.message}
            value={maintenance.message}
            onChange={(v) =>
              updateContent((prev) => ({
                ...prev,
                maintenance: { ...prev.maintenance, message: v },
              }))
            }
            textarea
            rows={2}
          />

          <div>
            <label className="text-xs font-semibold text-foreground">
              {t.settings.maintenance.allowedIps}
            </label>
            <input
              type="text"
              value={maintenance.allowedIps}
              onChange={(e) =>
                updateContent((prev) => ({
                  ...prev,
                  maintenance: { ...prev.maintenance, allowedIps: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* 7. BACKUP & RECOVERY */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6 rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground">
              {t.settings.backup.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.settings.backup.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={exportBackup}
              className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              <Download className="h-4 w-4" />
              <span>{t.settings.backup.exportBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              <span>{t.settings.backup.importBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.settings.backup.resetBtn}</span>
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">
              {t.settings.backup.importBtn}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.settings.backup.importPrompt}
            </p>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste JSON here..."
              className="mt-3 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
              >
                استعادة الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold">تحذير مهم</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t.settings.backup.resetConfirm}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDefaults()
                  setShowResetModal(false)
                }}
                className="rounded-lg bg-destructive px-5 py-2 text-xs font-semibold text-white hover:bg-destructive/90"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
