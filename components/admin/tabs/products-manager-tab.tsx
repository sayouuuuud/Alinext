'use client'

import React, { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Save,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import { MultiLangInput } from '../multilang-input'
import { ImageUpload } from '@/components/admin/image-upload'
import type { ProductItem } from '@/lib/admin/types'

export function ProductsManagerTab() {
  const { t, content, updateContent, locale, showToast, persist, deleteResource, isSaving } = useAdmin()

  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const emptyProduct: ProductItem = {
    id: '',
    name: { ar: '', en: '', he: '' },
    sku: '',
    category: '',
    categoryId: '',
    subcategoryId: '',
    price: 0,
    inStock: true,
    compatibility: '',
    image: '',
    description: { ar: '', en: '', he: '' },
  }

  const [formData, setFormData] = useState<ProductItem>(emptyProduct)

  const products = content.products || []
  const categories = content.categories || []
  const mainCategories = categories.filter((c) => !c.parentId)

  const filteredProducts = products.filter((p) => {
    const nameMatch =
      p.name?.[locale]?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.en?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())

    const stockMatch =
      stockFilter === 'all' ||
      (stockFilter === 'inStock' ? p.inStock : !p.inStock)

    return nameMatch && stockMatch
  })

  const openAddModal = () => {
    setEditingProduct(null)
    const firstMainCat = mainCategories[0]?.id || ''
    setFormData({
      ...emptyProduct,
      id: `prod-${Date.now()}`,
      categoryId: firstMainCat,
      category: firstMainCat,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p)
    setFormData({
      ...p,
      categoryId: p.categoryId || p.category || '',
      subcategoryId: p.subcategoryId || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.ar && !formData.name?.en) {
      showToast('يرجى إدخال اسم القطعة بالعربية أو الإنجليزية', 'error')
      return
    }
    if (!formData.sku?.trim()) {
      showToast('يرجى إدخال رمز القطعة SKU', 'error')
      return
    }

    setIsSubmitting(true)
    const nextProducts = editingProduct
      ? products.map((item) => (item.id === formData.id ? formData : item))
      : [formData, ...products]

    const success = await persist('products', nextProducts)
    setIsSubmitting(false)

    if (success) {
      updateContent((prev) => ({ ...prev, products: nextProducts }))
      showToast(editingProduct ? 'تم تحديث بيانات القطعة وحفظها بنجاح' : 'تمت إضافة القطعة إلى الكتالوج وحفظها في قاعدة البيانات')
      setIsModalOpen(false)
    } else {
      showToast('تعذر حفظ القطعة في قاعدة البيانات، يرجى المحاولة مرة أخرى', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    const result = await deleteResource('product', id)
    setIsDeleting(false)

    if (result.ok) {
      updateContent((prev) => ({ ...prev, products: (prev.products || []).filter((product) => product.id !== id) }))
      setDeleteConfirmId(null)
      showToast('تمت أرشفة القطعة وإخفاؤها مع الاحتفاظ بسجل الطلبات')
    } else {
      showToast('تعذرت أرشفة القطعة. تحقق من الصلاحية ثم حاول مجددًا', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.productsManager.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.productsManager.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => persist('products', products).then((ok) => {
              if (ok) showToast('تم حفظ كتالوج المنتجات في قاعدة البيانات بنجاح')
              else showToast('تعذر حفظ المنتجات في قاعدة البيانات', 'error')
            })}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-primary" />}
            <span>حفظ المنتجات</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>{t.productsManager.addNewProduct}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.productsManager.searchPlaceholder}
            className="w-full rounded-xl border border-border bg-card ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="all">كافة الحالات</option>
            <option value="inStock">متوفر بالمخزون</option>
            <option value="outOfStock">غير متوفر</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-border/80 bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">المنتج / الصورة</th>
                <th className="px-4 py-3 text-start">رقم القطعة (SKU)</th>
                <th className="px-4 py-3 text-start">التصنيف</th>
                <th className="px-4 py-3 text-start">السعر</th>
                <th className="px-4 py-3 text-start">حالة المخزون</th>
                <th className="px-4 py-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {filteredProducts.map((p) => {
                const prodName = p.name?.[locale] || p.name?.ar || p.sku

                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={prodName}
                          className="h-10 w-12 rounded-lg object-cover border border-border"
                        />
                        <div>
                          <p className="font-bold text-foreground">{prodName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.compatibility}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const targetCatId = p.categoryId || p.category
                        const cat = categories.find((c) => c.id === targetCatId || c.slug === targetCatId)
                        const subCat = p.subcategoryId ? categories.find((c) => c.id === p.subcategoryId || c.slug === p.subcategoryId) : null
                        const mainCat = cat?.parentId ? categories.find((c) => c.id === cat.parentId) : cat

                        if (!mainCat && !subCat) {
                          return (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {p.category}
                            </span>
                          )
                        }

                        return (
                          <div className="flex flex-col gap-0.5">
                            {mainCat && (
                              <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold w-fit">
                                {mainCat.name?.[locale] || mainCat.name?.ar || mainCat.name?.en || mainCat.id}
                              </span>
                            )}
                            {subCat && (
                              <span className="text-[10px] text-muted-foreground font-medium ps-1">
                                ↳ {subCat.name?.[locale] || subCat.name?.ar || subCat.name?.en || subCat.id}
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      {p.price.toLocaleString()} ₪
                    </td>
                    <td className="px-4 py-3">
                      {p.inStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          متوفر
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                          <XCircle className="h-3 w-3" />
                          غير متوفر
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingProduct ? t.productsManager.editProduct : t.productsManager.addNewProduct}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pe-1">
              <MultiLangInput
                label="اسم قطعة الغيار (Part Name)"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                required
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.productsManager.skuLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="مثال: PRD-001"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.productsManager.priceLabel} (₪)
                  </label>
                  <input
                    type="number"
                    value={formData.price ? formData.price : ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Hierarchical Categories Selection */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-border bg-muted/20 p-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    التصنيف الرئيسي (Main Category)
                  </label>
                  <select
                    value={formData.categoryId || formData.category || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      const selected = categories.find((c) => c.id === val || c.slug === val)
                      setFormData({
                        ...formData,
                        categoryId: val,
                        category: selected?.slug || val,
                        subcategoryId: '',
                      })
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="">اختر التصنيف الرئيسي…</option>
                    {mainCategories.map((main) => (
                      <option key={main.id} value={main.id}>
                        {main.name?.[locale] || main.name?.ar || main.name?.en || main.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    التصنيف الفرعي (Subcategory - اختياري)
                  </label>
                  <select
                    value={formData.subcategoryId || ''}
                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    disabled={!formData.categoryId && !formData.category}
                  >
                    <option value="">(بدون تصنيف فرعي)</option>
                    {categories
                      .filter(
                        (c) =>
                          c.parentId &&
                          (c.parentId === formData.categoryId || c.parentId === formData.category),
                      )
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name?.[locale] || sub.name?.ar || sub.name?.en || sub.id}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t.productsManager.compatibilityLabel}
                </label>
                <input
                  type="text"
                  value={formData.compatibility}
                  onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                  placeholder="مثال: Mercedes S-Class, Maybach, Actros"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Image Upload with file picker from device or URL */}
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                label={t.productsManager.imageLabel}
                aspectHint="1:1 أو 4:3 موصى به للقطع والمنتجات"
              />

              <MultiLangInput
                label="شرح ومواصفات القطعة (Description)"
                value={formData.description}
                onChange={(v) => setFormData({ ...formData, description: v })}
                textarea
                rows={3}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="stock-toggle"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="stock-toggle" className="text-xs font-semibold text-foreground cursor-pointer">
                  {t.productsManager.inStockLabel}
                </label>
              </div>

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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'جاري الحفظ...' : t.productsManager.saveProduct}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h4 className="text-sm font-bold text-foreground">
              {t.productsManager.deleteProduct}
            </h4>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.productsManager.deleteConfirm}
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
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
