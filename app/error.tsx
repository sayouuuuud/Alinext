'use client'

import React, { useEffect } from 'react'
import { RefreshCw, AlertTriangle, Home } from 'lucide-react'
import Link from 'next/link'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // If it's a chunk mismatch caused by a new Vercel deployment swap, auto reload
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.toLowerCase().includes('loading chunk') ||
      error?.message?.toLowerCase().includes('failed to fetch')

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('alifleet_deployment_reload')
      if (!hasReloaded) {
        sessionStorage.setItem('alifleet_deployment_reload', '1')
        window.location.reload()
      }
    }
  }, [error])

  const handleReload = () => {
    try {
      sessionStorage.removeItem('alifleet_deployment_reload')
    } catch {}
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 ring-1 ring-amber-500/20 shadow-xs">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-foreground">
        تم تحديث النظام
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
        تم نشر إصدار أحدث للموقع لتحسين الأداء. يرجى الضغط على زر التحديث لتطبيق التعديلات ومتابعة العمل بسلاسة.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleReload}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>تحديث الصفحة الآن</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-all"
        >
          <Home className="h-4 w-4 text-muted-foreground" />
          <span>الرئيسية</span>
        </Link>
      </div>
    </div>
  )
}
