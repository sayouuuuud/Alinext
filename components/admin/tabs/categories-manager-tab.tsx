'use client'

import React, { useState, useMemo } from 'react'
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Flame,
  ShieldAlert,
  Lightbulb,
  Disc,
  Cog,
  Filter,
  Zap,
  Box,
  Wrench,
  Gauge,
  Tag,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import type { CategoryItem, MultiLangString } from '@/lib/admin/types'
import { MultiLangInput } from '@/components/admin/multilang-input'
import { ImageUpload } from '@/components/admin/image-upload'

const AVAILABLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldAlert,
  Flame,
  Lightbulb,
  Disc,
  Cog,
  Filter,
  Layers,
  Zap,
  Sparkles,
  Box,
  Wrench,
  Gauge,
  Tag,
  FolderTree,
}

const emptyCategoryForm: CategoryItem = {
  id: '',
  slug: '',
  name: { ar: '', en: '', he: '' },
  description: { ar: '', en: '', he: '' },
  parentId: null,
  icon: 'FolderTree',
  image: '',
  sortOrder: 10,
  isActive: true,
}

export function CategoriesManagerTab() {
  const { content, updateContent, persist, showToast, locale } = useAdmin()

  const categories = content.categories || []
  const products = content.products || []

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'main' | 'sub' | 'active'>('all')
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({})

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [formData, setFormData] = useState<CategoryItem>(emptyCategoryForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete modal state
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<CategoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Separate main vs subcategories
  const mainCategories = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [categories],
  )

  const subCategoriesByParent = useMemo(() => {
    const map = new Map<string, CategoryItem[]>()
    for (const cat of categories) {
      if (cat.parentId) {
        const list = map.get(cat.parentId) || []
        list.push(cat)
        map.set(cat.parentId, list)
      }
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }
    return map
  }, [categories])

  // Count products per category
  const productCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      if (p.categoryId) {
        map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1)
      }
      if (p.subcategoryId) {
        map.set(p.subcategoryId, (map.get(p.subcategoryId) || 0) + 1)
      }
      if (p.category) {
        map.set(p.category, (map.get(p.category) || 0) + 1)
      }
    }
    return map
  }, [products])

  // Total products under a main category (including its subcategories)
  const totalProductsUnderMain = (mainId: string) => {
    let count = productCountMap.get(mainId) || 0
    const subs = subCategoriesByParent.get(mainId) || []
    for (const sub of subs) {
      count += productCountMap.get(sub.id) || 0
    }
    return count
  }

  // Filtered categories
  const filteredMainCategories = useMemo(() => {
    return mainCategories.filter((cat) => {
      const name = cat.name?.[locale] || cat.name?.ar || cat.name?.en || cat.id
      const matchesSearch =
        !searchQuery.trim() ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) {
        // Check if any subcategory matches search
        const subs = subCategoriesByParent.get(cat.id) || []
        const subMatches = subs.some((s) => {
          const subName = s.name?.[locale] || s.name?.ar || s.name?.en || s.id
          return (
            subName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.slug.toLowerCase().includes(searchQuery.toLowerCase())
          )
        })
        if (!subMatches) return false
      }

      if (filterType === 'active' && !cat.isActive) return false
      return true
    })
  }, [mainCategories, subCategoriesByParent, searchQuery, filterType, locale])

  const toggleCollapse = (parentId: string) => {
    setCollapsedParents((prev) => ({ ...prev, [parentId]: !prev[parentId] }))
  }

  const openAddModal = (defaultParentId: string | null = null) => {
    setEditingCategory(null)
    const newId = `cat-${Date.now().toString(36)}`
    setFormData({
      ...emptyCategoryForm,
      id: newId,
      slug: '',
      parentId: defaultParentId,
      sortOrder: (categories.length + 1) * 10,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (category: CategoryItem) => {
    setEditingCategory(category)
    setFormData({ ...category })
    setIsModalOpen(true)
  }

  const handleNameChange = (nameObj: MultiLangString) => {
    const updated = { ...formData, name: nameObj }
    // Auto-generate slug from English name if slug is empty or currently editing freshly
    if (!editingCategory && !formData.slug && nameObj.en) {
      updated.slug = nameObj.en
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    setFormData(updated)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.ar?.trim() && !formData.name?.en?.trim()) {
      showToast('يرجى إدخال اسم التصنيف بالعربية أو الإنجليزية', 'error')
      return
    }

    const finalSlug = (
      formData.slug?.trim() ||
      formData.name?.en?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
      formData.id
    ).replace(/\s+/g, '-')

    const categoryToSave: CategoryItem = {
      ...formData,
      slug: finalSlug,
      sortOrder: Number(formData.sortOrder) || 0,
    }

    setIsSubmitting(true)
    const nextCategories = editingCategory
      ? categories.map((item) => (item.id === categoryToSave.id ? categoryToSave : item))
      : [...categories, categoryToSave]

    const success = await persist('categories', nextCategories)
    setIsSubmitting(false)

    if (success) {
      updateContent((prev) => ({ ...prev, categories: nextCategories }))
      showToast(
        editingCategory
          ? 'تم تحديث بيانات التصنيف وحفظها بنجاح'
          : 'تمت إضافة التصنيف الجديد وحفظه في قاعدة البيانات',
      )
      setIsModalOpen(false)
    } else {
      showToast('تعذر حفظ التصنيف في قاعدة البيانات، يرجى المحاولة مرة أخرى', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmCategory) return
    const id = deleteConfirmCategory.id

    // Check if category has subcategories
    const hasSubs = (subCategoriesByParent.get(id) || []).length > 0
    if (hasSubs) {
      showToast('لا يمكن حذف هذا التصنيف الرئيسي لأنه يحتوي على تصنيفات فرعية مرتبطة به', 'error')
      setDeleteConfirmCategory(null)
      return
    }

    setIsDeleting(true)
    const nextCategories = categories.filter((c) => c.id !== id)
    const success = await persist('categories', nextCategories)
    setIsDeleting(false)

    if (success) {
      updateContent((prev) => ({ ...prev, categories: nextCategories }))
      setDeleteConfirmCategory(null)
      showToast('تم حذف التصنيف بنجاح وتحديث المتجر')
    } else {
      showToast('تعذر حذف التصنيف من قاعدة البيانات', 'error')
    }
  }

  const handleToggleActive = async (cat: CategoryItem) => {
    const updated = { ...cat, isActive: !cat.isActive }
    const nextCategories = categories.map((c) => (c.id === cat.id ? updated : c))
    const success = await persist('categories', nextCategories)
    if (success) {
      updateContent((prev) => ({ ...prev, categories: nextCategories }))
      showToast(`تم ${updated.isActive ? 'تفعيل' : 'تعطيل'} التصنيف بنجاح`)
    }
  }

  const getCategoryName = (cat: CategoryItem) => {
    return cat.name?.[locale] || cat.name?.ar || cat.name?.en || cat.id
  }

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <FolderTree className="h-3.5 w-3.5" />
            <span>نظام التصنيفات المتكامل • Taxonomy Manager</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            إدارة التصنيفات والأنواع
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            تنظيم وهيكلة قطع الغيار والمنتجات بروابط هرمية بين التصنيفات الرئيسية والفرعية بـ 3 لغات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddModal(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة تصنيف رئيسي</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">إجمالي التصنيفات</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderTree className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{categories.length}</p>
          <span className="text-[11px] text-muted-foreground">رئيسية وفرعية مسجلة</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">التصنيفات الرئيسية</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{mainCategories.length}</p>
          <span className="text-[11px] text-muted-foreground">أقسام رئيسية للمتجر</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">التصنيفات الفرعية</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">
            {categories.filter((c) => !!c.parentId).length}
          </p>
          <span className="text-[11px] text-muted-foreground">فروع متخصصة</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">القطع والمنتجات</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{products.length}</p>
          <span className="text-[11px] text-muted-foreground">في الكتالوج الحي</span>
        </div>
      </div>

      {/* Toolbar: Search, Filter Tabs & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم العربي، الإنجليزي، أو المعرّف (Slug)…"
            className="w-full rounded-xl border border-border bg-card ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              الكل ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('main')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                filterType === 'main'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              الرئيسية ({mainCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('active')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                filterType === 'active'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              النشطة ({categories.filter((c) => c.isActive).length})
            </button>
          </div>
        </div>
      </div>

      {/* Categories Hierarchy List */}
      <div className="space-y-4">
        {filteredMainCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FolderTree className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-foreground">لا توجد تصنيفات مطابقة</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery ? 'جرّب تعديل كلمة البحث أو تصفية الفلاتر' : 'ابدأ بإضافة أول تصنيف رئيسي لمتجرك'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => openAddModal(null)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة تصنيف الآن</span>
              </button>
            )}
          </div>
        ) : (
          filteredMainCategories.map((mainCat) => {
            const subCats = subCategoriesByParent.get(mainCat.id) || []
            const isCollapsed = Boolean(collapsedParents[mainCat.id])
            const totalProducts = totalProductsUnderMain(mainCat.id)
            const IconComponent = AVAILABLE_ICONS[mainCat.icon || 'FolderTree'] || FolderTree

            return (
              <div
                key={mainCat.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  mainCat.isActive
                    ? 'border-border bg-card shadow-xs'
                    : 'border-border/60 bg-muted/20 opacity-75'
                }`}
              >
                {/* Main Category Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(mainCat.id)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title={isCollapsed ? 'فتح التصنيفات الفرعية' : 'طي التصنيفات الفرعية'}
                    >
                      {subCats.length > 0 ? (
                        isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </button>

                    {/* Icon or Image */}
                    {mainCat.image ? (
                      <img
                        src={mainCat.image}
                        alt={getCategoryName(mainCat)}
                        className="h-10 w-10 rounded-xl object-cover border border-border/80 shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    )}

                    {/* Titles and Slug */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {getCategoryName(mainCat)}
                        </h3>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {mainCat.slug}
                        </span>
                        {!mainCat.isActive && (
                          <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                            معطل
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {mainCat.name?.en && mainCat.name.en !== getCategoryName(mainCat) && (
                          <span className="me-2">{mainCat.name.en}</span>
                        )}
                        {mainCat.description?.[locale] || mainCat.description?.ar || ''}
                      </p>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Subcategories count badge */}
                    <span className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                      <Tag className="h-3 w-3" />
                      <span>{subCats.length} فرعي</span>
                    </span>

                    {/* Products count badge */}
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span>{totalProducts} منتج</span>
                    </span>

                    {/* Quick Add Subcategory */}
                    <button
                      type="button"
                      onClick={() => openAddModal(mainCat.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                      title="إضافة تصنيف فرعي تحت هذا القسم"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      <span className="hidden md:inline">فرعي جديد</span>
                    </button>

                    {/* Toggle Active */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(mainCat)}
                      className={`rounded-lg border border-border p-1.5 transition-colors ${
                        mainCat.isActive
                          ? 'text-emerald-600 hover:bg-emerald-500/10'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      title={mainCat.isActive ? 'تعطيل التصنيف' : 'تفعيل التصنيف'}
                    >
                      {mainCat.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(mainCat)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                      title="تعديل التصنيف"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmCategory(mainCat)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="حذف التصنيف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories List (Collapsible) */}
                {!isCollapsed && (
                  <div className="border-t border-border/60 bg-muted/15 p-3 sm:ps-12">
                    {subCats.length === 0 ? (
                      <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
                        <span>لا توجد تصنيفات فرعية بعد تحت هذا القسم الرئيسي.</span>
                        <button
                          type="button"
                          onClick={() => openAddModal(mainCat.id)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          + إضافة أول تصنيف فرعي
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {subCats.map((sub) => {
                          const subProductCount = productCountMap.get(sub.id) || 0
                          const SubIcon = AVAILABLE_ICONS[sub.icon || 'Tag'] || Tag
                          return (
                            <div
                              key={sub.id}
                              className={`flex items-center justify-between gap-2 rounded-xl border p-3 bg-card transition-colors ${
                                sub.isActive
                                  ? 'border-border/80 shadow-2xs hover:border-primary/40'
                                  : 'border-border/40 bg-muted/40 opacity-70'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                                  <SubIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs font-bold text-foreground truncate">
                                      {getCategoryName(sub)}
                                    </h4>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      ({sub.slug})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {sub.name?.en && sub.name.en !== getCategoryName(sub) && (
                                      <span className="me-2">{sub.name.en}</span>
                                    )}
                                    {sub.description?.[locale] || sub.description?.ar || ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                                  {subProductCount} منتج
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(sub)}
                                  className="rounded-lg border border-border p-1 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                                  title="تعديل الفرعي"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmCategory(sub)}
                                  className="rounded-lg border border-border p-1 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  title="حذف الفرعي"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FolderTree className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {editingCategory ? 'تعديل بيانات التصنيف' : 'إضافة تصنيف جديد'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formData.parentId ? 'تصنيف فرعي مرتبط بتصنيف رئيسي' : 'تصنيف رئيسي في المتجر'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pe-1">
              {/* Category Hierarchy Selection */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  نوع ومستوى التصنيف (Hierarchy Level)
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, parentId: e.target.value ? e.target.value : null })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                >
                  <option value="">⭐ بدون تصنيف أب — (تصنيف رئيسي Main Category)</option>
                  {mainCategories
                    .filter((m) => m.id !== formData.id) // Avoid self-parenting
                    .map((main) => (
                      <option key={main.id} value={main.id}>
                        ↳ تصنيف فرعي تابع لـ: {getCategoryName(main)} ({main.slug})
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  التصنيف الرئيسي يظهر في رأس القوائم، بينما التصنيف الفرعي يندرج تحته لتصنيف أدق للقطع.
                </p>
              </div>

              {/* MultiLang Name Input */}
              <MultiLangInput
                label="اسم التصنيف (Category Name)"
                value={formData.name}
                onChange={handleNameChange}
                required
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Slug Input */}
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    المعرّف الرابط (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    placeholder="مثال: brakes, engine-filters"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">
                    يُستخدم في الروابط البرمجية وعمليات الفلترة.
                  </span>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    ترتيب الظهور (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    الرقم الأصغر يظهر أولاً في المتجر.
                  </span>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  الأيقونة التعبيرية (Icon)
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(AVAILABLE_ICONS).map(([key, IconComp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: key })}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                        formData.icon === key
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={key}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <ImageUpload
                value={formData.image || ''}
                onChange={(url) => setFormData({ ...formData, image: url })}
                label="صورة أو بنر التصنيف (اختياري)"
                aspectHint="1:1 أو 16:9 موصى به للتصنيفات الرئيسية"
              />

              {/* MultiLang Description */}
              <MultiLangInput
                label="شرح ونبذة عن التصنيف (Description)"
                value={formData.description || { ar: '', en: '', he: '' }}
                onChange={(v: MultiLangString) => setFormData({ ...formData, description: v })}
                textarea
                rows={2}
              />

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="category-active-toggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="category-active-toggle" className="text-xs font-semibold text-foreground">
                  تفعيل التصنيف وعرضه للزوار في الموقع والمتجر
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جارٍ الحفظ والمزامنة…</span>
                  ) : (
                    <span>{editingCategory ? 'حفظ التعديلات' : 'إضافة التصنيف'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">تأكيد حذف التصنيف</h3>
                <p className="text-xs text-muted-foreground">لا يمكن التراجع عن هذه الخطوة</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-destructive/5 p-3 border border-destructive/15 text-xs text-foreground space-y-1.5">
              <p>
                هل أنت متأكد من رغبتك في حذف التصنيف{' '}
                <strong className="text-destructive font-bold">
                  "{getCategoryName(deleteConfirmCategory)}"
                </strong>
                ؟
              </p>
              {totalProductsUnderMain(deleteConfirmCategory.id) > 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ يوجد {totalProductsUnderMain(deleteConfirmCategory.id)} منتج مرتبط بهذا التصنيف.
                  سيتم فك ارتباط هذه المنتجات بالتصنيف.
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCategory(null)}
                disabled={isDeleting}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isDeleting ? 'جارٍ الحذف…' : 'تأكيد الحذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
