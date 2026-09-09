'use client'

import React, { useState } from 'react'
import {
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  Search,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import type { InquiryItem } from '@/lib/admin/types'

export function InquiriesTab() {
  const { t, content, updateContent, showToast } = useAdmin()

  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all')
  const [search, setSearch] = useState('')

  const inquiries = content.inquiries || []

  const filtered = inquiries.filter((inq) => {
    const matchesFilter = filter === 'all' || inq.status === filter
    const matchesSearch =
      inq.name.toLowerCase().includes(search.toLowerCase()) ||
      inq.email.toLowerCase().includes(search.toLowerCase()) ||
      inq.phone.includes(search) ||
      inq.service.toLowerCase().includes(search.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const updateStatus = (id: string, nextStatus: 'new' | 'contacted' | 'resolved') => {
    updateContent((prev) => ({
      ...prev,
      inquiries: (prev.inquiries || []).map((i) =>
        i.id === id ? { ...i, status: nextStatus } : i
      ),
    }))
    showToast('تم تحديث حالة الطلب')
  }

  const deleteInquiry = (id: string) => {
    updateContent((prev) => ({
      ...prev,
      inquiries: (prev.inquiries || []).filter((i) => i.id !== id),
    }))
    showToast('تم حذف الطلب')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.inquiries.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.inquiries.subtitle}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          {(['all', 'new', 'contacted', 'resolved'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {f === 'all'
                ? t.inquiries.filterAll
                : f === 'new'
                ? t.inquiries.filterNew
                : f === 'contacted'
                ? t.inquiries.filterContacted
                : t.inquiries.filterResolved}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الهاتف أو الخدمة…"
          className="w-full rounded-xl border border-border bg-card ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
        />
      </div>

      {/* Inquiries Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
            {t.inquiries.emptyState}
          </div>
        ) : (
          filtered.map((inq) => {
            const cleanPhone = inq.phone.replace(/[^\d]/g, '')

            return (
              <div
                key={inq.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-2xs md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {inq.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        inq.status === 'new'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : inq.status === 'contacted'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {inq.status === 'new'
                        ? t.inquiries.statusNew
                        : inq.status === 'contacted'
                        ? t.inquiries.statusContacted
                        : t.inquiries.statusResolved}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {inq.date}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-primary">
                    {inq.service}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {inq.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="h-3 w-3 text-primary" />
                      {inq.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-primary" />
                      {inq.email}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 md:border-0 md:pt-0">
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{t.inquiries.openWhatsApp}</span>
                    </a>
                  )}

                  {inq.status !== 'contacted' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(inq.id, 'contacted')}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      {t.inquiries.markContacted}
                    </button>
                  )}

                  {inq.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(inq.id, 'resolved')}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted hover:text-primary"
                    >
                      {t.inquiries.markResolved}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteInquiry(inq.id)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
