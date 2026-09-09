'use client'

import React, { useState } from 'react'
import type { MultiLangString } from '@/lib/admin/types'
import type { AdminLocale } from '@/lib/admin/admin-i18n'

interface MultiLangInputProps {
  label: string
  value: MultiLangString
  onChange: (val: MultiLangString) => void
  textarea?: boolean
  rows?: number
  placeholder?: { ar?: string; en?: string; he?: string }
  required?: boolean
  className?: string
  helperText?: string
}

export function MultiLangInput({
  label,
  value,
  onChange,
  textarea = false,
  rows = 3,
  placeholder,
  required = false,
  className = '',
  helperText,
}: MultiLangInputProps) {
  const [activeLang, setActiveLang] = useState<AdminLocale>('ar')
  const [showAll, setShowAll] = useState(false)

  const handleFieldChange = (lang: AdminLocale, text: string) => {
    onChange({
      ...value,
      [lang]: text,
    })
  }

  const langs: { key: AdminLocale; label: string; dir: 'rtl' | 'ltr'; flag: string }[] = [
    { key: 'ar', label: 'العربية', dir: 'rtl', flag: '🇸🇦' },
    { key: 'he', label: 'עברית', dir: 'rtl', flag: '🇮🇱' },
    { key: 'en', label: 'English', dir: 'ltr', flag: '🇬🇧' },
  ]

  const isFilled = (lang: AdminLocale) => Boolean(value?.[lang]?.trim())
  const allFilled = isFilled('ar') && isFilled('he') && isFilled('en')

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              allFilled ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            title={allFilled ? 'مكتمل بـ 3 لغات' : 'بحاجة لاستكمال باقي اللغات'}
          />
        </label>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className={`rounded px-2 py-0.5 transition-colors ${
              !showAll
                ? 'bg-background font-medium text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            تبويب (Tabs)
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`rounded px-2 py-0.5 transition-colors ${
              showAll
                ? 'bg-background font-medium text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            الكل معاً (All)
          </button>
        </div>
      </div>

      {/* Tabbed view */}
      {!showAll ? (
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-2xs">
          {/* Language Tabs */}
          <div className="flex border-b border-border/70 bg-muted/30 p-1">
            {langs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveLang(item.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                  activeLang === item.key
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
                {isFilled(item.key) ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60">•</span>
                )}
              </button>
            ))}
          </div>

          {/* Active input field */}
          <div className="p-2.5">
            {langs
              .filter((item) => item.key === activeLang)
              .map((item) => (
                <div key={item.key} dir={item.dir}>
                  {textarea ? (
                    <textarea
                      rows={rows}
                      value={value?.[item.key] || ''}
                      onChange={(e) => handleFieldChange(item.key, e.target.value)}
                      placeholder={placeholder?.[item.key] || `أدخل النص بـ ${item.label}…`}
                      className="w-full resize-y rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value?.[item.key] || ''}
                      onChange={(e) => handleFieldChange(item.key, e.target.value)}
                      placeholder={placeholder?.[item.key] || `أدخل النص بـ ${item.label}…`}
                      className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* Side by Side / All view */
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {langs.map((item) => (
            <div
              key={item.key}
              dir={item.dir}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2.5"
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </span>
                {isFilled(item.key) && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">مكتمل</span>
                )}
              </div>
              {textarea ? (
                <textarea
                  rows={rows}
                  value={value?.[item.key] || ''}
                  onChange={(e) => handleFieldChange(item.key, e.target.value)}
                  placeholder={placeholder?.[item.key] || `أدخل النص بـ ${item.label}…`}
                  className="w-full resize-y rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              ) : (
                <input
                  type="text"
                  value={value?.[item.key] || ''}
                  onChange={(e) => handleFieldChange(item.key, e.target.value)}
                  placeholder={placeholder?.[item.key] || `أدخل النص بـ ${item.label}…`}
                  className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {helperText && (
        <span className="text-[11px] text-muted-foreground">{helperText}</span>
      )}
    </div>
  )
}
