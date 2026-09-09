'use client'

import React, { useState } from 'react'
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  User,
  X,
  Tag,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import { MultiLangInput } from '../multilang-input'
import { ImageUpload } from '@/components/admin/image-upload'
import type { BlogPostItem } from '@/lib/admin/types'

export function BlogManagerTab() {
  const { t, content, updateContent, locale, showToast } = useAdmin()

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPostItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const emptyPost: BlogPostItem = {
    id: '',
    slug: '',
    title: { ar: '', en: '', he: '' },
    excerpt: { ar: '', en: '', he: '' },
    content: { ar: '', en: '', he: '' },
    author: 'علي فليت',
    date: new Date().toISOString().slice(0, 10),
    readTime: '6 min',
    coverImage: '/images/fleet-truck.png',
    tags: ['شاحنات', 'أسطول', 'استيراد'],
  }

  const [formData, setFormData] = useState<BlogPostItem>(emptyPost)
  const [tagsInput, setTagsInput] = useState('')

  const blogPosts = content.blog || []

  const filteredPosts = blogPosts.filter((post) => {
    const titleMatch =
      post.title?.[locale]?.toLowerCase().includes(search.toLowerCase()) ||
      post.title?.ar?.toLowerCase().includes(search.toLowerCase()) ||
      post.title?.en?.toLowerCase().includes(search.toLowerCase())

    const postTags = Array.isArray(post.tags) ? post.tags : []
    const tagMatch = postTags.some((tag) =>
      tag && typeof tag === 'string' && tag.toLowerCase().includes(search.toLowerCase())
    )

    return titleMatch || tagMatch
  })

  const openAddModal = () => {
    setEditingPost(null)
    setFormData({
      ...emptyPost,
      id: `post-${Date.now()}`,
    })
    setTagsInput('سيارات فاخرة, استيراد')
    setIsModalOpen(true)
  }

  const openEditModal = (p: BlogPostItem) => {
    setEditingPost(p)
    setFormData({ ...p })
    setTagsInput(Array.isArray(p.tags) ? p.tags.join(', ') : '')
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title?.ar && !formData.title?.en) {
      showToast('يرجى كتابة عنوان المقال', 'error')
      return
    }

    const cleanedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: BlogPostItem = {
      ...formData,
      slug:
        formData.slug ||
        `article-${Date.now()}`,
      tags: cleanedTags,
    }

    if (editingPost) {
      updateContent((prev) => ({
        ...prev,
        blog: prev.blog.map((item) => (item.id === payload.id ? payload : item)),
      }))
      showToast('تم تحديث المقال بنجاح')
    } else {
      updateContent((prev) => ({
        ...prev,
        blog: [payload, ...prev.blog],
      }))
      showToast('تم نشر وحفظ المقال الجديد')
    }

    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    updateContent((prev) => ({
      ...prev,
      blog: prev.blog.filter((p) => p.id !== id),
    }))
    setDeleteConfirmId(null)
    showToast('تم حذف المقال')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.blogManager.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.blogManager.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>{t.blogManager.addNewArticle}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.blogManager.searchPlaceholder}
          className="w-full rounded-xl border border-border bg-card ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
        />
      </div>

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {filteredPosts.map((post) => {
          const postTitle = post.title?.[locale] || post.title?.ar || 'بدون عنوان'
          const postExcerpt = post.excerpt?.[locale] || post.excerpt?.ar || ''

          return (
            <div
              key={post.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="relative aspect-16/9 w-full overflow-hidden bg-muted">
                <img
                  src={post.coverImage || post.image || '/images/fleet-truck.png'}
                  alt={postTitle}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2.5 start-2.5 flex flex-wrap gap-1">
                  {(Array.isArray(post.tags) ? post.tags : []).slice(0, 2).map((tg, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {postTitle}
                </h3>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {postExcerpt}
                </p>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(post)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(post.id)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingPost ? t.blogManager.editArticle : t.blogManager.addNewArticle}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pe-1">
              <MultiLangInput
                label="عنوان المقال (Article Title)"
                value={formData.title}
                onChange={(v) => setFormData({ ...formData, title: v })}
                required
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    اسم الكاتب
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    تاريخ النشر
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    وقت القراءة
                  </label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="5 min"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Image Upload with file picker from device or URL */}
              <ImageUpload
                value={formData.coverImage}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
                label="صورة الغلاف (Cover Image)"
                aspectHint="16:9 موصى به لمقالات المدونة"
              />

              <div>
                <label className="text-xs font-semibold text-foreground">
                  الوسوم (Tags - مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="استيراد, مايباخ, نصائح"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <MultiLangInput
                label="المقتطف التمهيدي (Excerpt)"
                value={formData.excerpt}
                onChange={(v) => setFormData({ ...formData, excerpt: v })}
                textarea
                rows={2}
              />

              <MultiLangInput
                label="نص المقال الكامل (Full Content)"
                value={formData.content || { ar: '', en: '', he: '' }}
                onChange={(v) => setFormData({ ...formData, content: v })}
                textarea
                rows={5}
              />

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
                >
                  حفظ المقال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h4 className="text-sm font-bold text-foreground">
              {t.blogManager.deleteArticle}
            </h4>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.blogManager.deleteConfirm}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
