'use client'

import React, { useRef, useState } from 'react'
import {
  Upload,
  Image as ImageIcon,
  X,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  aspectHint?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  label,
  aspectHint,
  className = '',
}: ImageUploadProps) {
  const { dir } = useAdmin()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [previewError, setPreviewError] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const isBase64 = value?.startsWith('data:image/')

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (أقصى حد 10 ميجابايت)')
      return
    }

    setIsUploading(true)
    setPreviewError(false)

    // Immediate local preview so UI updates instantly
    const localUrl = URL.createObjectURL(file)
    onChange(localUrl)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      if (data.url) {
        onChange(data.url)
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)
      }
    } catch (err) {
      console.warn('Direct upload to storage failed, falling back to base64 DataURL:', err)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          onChange(result)
          setUploadSuccess(true)
          setTimeout(() => setUploadSuccess(false), 3000)
        }
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (urlDraft.trim()) {
      setPreviewError(false)
      onChange(urlDraft.trim())
      setUrlDraft('')
      setShowUrlInput(false)
    }
  }

  const handleRemove = () => {
    onChange('')
    setPreviewError(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">
            {label}
          </label>
          {aspectHint && (
            <span className="text-[11px] text-muted-foreground">
              {aspectHint}
            </span>
          )}
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* If an image exists, show the preview card with controls */}
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card/70 p-2 transition-all hover:border-primary/50">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted/40 flex items-center justify-center">
            {!previewError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Preview"
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-102"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-center text-xs text-destructive p-4">
                <AlertCircle className="size-6" />
                <span>تعذر تحميل الصورة، تحقق من الرابط أو الملف</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 start-2 flex items-center gap-1.5 z-20">
              <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium backdrop-blur-xs text-foreground shadow-xs border border-border/60">
                {value.includes('supabase.co/storage')
                  ? 'سحابي (Supabase Storage)'
                  : isBase64
                  ? 'ملف مرفوع من جهازك'
                  : 'رابط ويب خارجي'}
              </span>
              {uploadSuccess && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 text-white px-2 py-0.5 text-[10px] font-semibold backdrop-blur-xs shadow-xs animate-in fade-in">
                  <CheckCircle2 className="size-3" />
                  تم الرفع بنجاح
                </span>
              )}
            </div>

            {/* Uploading overlay */}
            {isUploading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-xs">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-semibold text-foreground">جاري الرفع إلى التخزين السحابي...</span>
              </div>
            )}

            {/* Hover overlay actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="size-3.5" />
                تغيير الصورة
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                <X className="size-3.5" />
                إزالة
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span className="truncate max-w-[240px]">
              {isBase64 ? 'تم التخزين محلياً كملف صورة' : value}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline font-medium"
              >
                استبدال من جهازك
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="hover:text-foreground"
              >
                رابط URL
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state: Drop zone & upload buttons */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40'
          }`}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Upload className="size-6" />
          </div>

          <h4 className="text-xs font-semibold text-foreground mb-1">
            اختر صورة من جهازك أو اسحبها هنا
          </h4>
          <p className="text-[11px] text-muted-foreground max-w-xs mb-4">
            يدعم صور JPG, PNG, WEBP حتى 8 ميجابايت بدقة عالية
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
            >
              <ImageIcon className="size-3.5" />
              اختيار ملف من جهازك
            </button>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <LinkIcon className="size-3.5 text-muted-foreground" />
              إدخال رابط صورة
            </button>
          </div>
        </div>
      )}

      {/* Optional URL input drawer */}
      {showUrlInput && (
        <form
          onSubmit={handleUrlSubmit}
          className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 animate-in fade-in"
        >
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://example.com/image.jpg"
            dir="ltr"
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!urlDraft.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            استخدام
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted"
          >
            إلغاء
          </button>
        </form>
      )}
    </div>
  )
}
