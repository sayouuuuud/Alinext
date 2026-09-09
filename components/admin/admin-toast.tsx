'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'

export function AdminToastContainer() {
  const { toasts, removeToast } = useAdmin()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 start-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
              : toast.type === 'error'
              ? 'border-destructive/40 bg-destructive/90 text-destructive-foreground'
              : 'border-primary/40 bg-card/90 text-foreground'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-white" />}
          {toast.type === 'info' && <Info className="h-4 w-4 shrink-0 text-primary" />}

          <span className="text-xs font-semibold">{toast.message}</span>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="ms-2 rounded p-0.5 opacity-70 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
