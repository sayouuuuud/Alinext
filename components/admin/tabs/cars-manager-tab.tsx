'use client'

import React, { useState } from 'react'
import {
  Car,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  Star,
  X,
  Gauge,
  Zap,
  Loader2,
  Save,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import { MultiLangInput } from '../multilang-input'
import { ImageUpload } from '@/components/admin/image-upload'
import type { CarItem, MultiLangString } from '@/lib/admin/types'

export function CarsManagerTab() {
  const { t, content, updateContent, locale, showToast, persist, deleteResource, isSaving } = useAdmin()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'import'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingCar, setEditingCar] = useState<CarItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const emptyCar: CarItem = {
    id: '',
    type: 'sale',
    title: { ar: '', en: '', he: '' },
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    currency: '₪',
    mileage: '',
    fuel: '',
    transmission: '',
    image: '',
    status: 'available',
    featured: false,
    specs: {
      engine: '',
      horsepower: '',
      acceleration: '',
      topSpeed: '',
      bodyType: '',
      color: '',
    },
    description: { ar: '', en: '', he: '' },
  }

  const [formData, setFormData] = useState<CarItem>(emptyCar)

  const cars = content.cars || []

  // Filter cars
  const filteredCars = cars.filter((car) => {
    const titleMatch =
      car.title?.[locale]?.toLowerCase().includes(search.toLowerCase()) ||
      car.title?.ar?.toLowerCase().includes(search.toLowerCase()) ||
      car.title?.en?.toLowerCase().includes(search.toLowerCase()) ||
      car.make.toLowerCase().includes(search.toLowerCase()) ||
      car.model.toLowerCase().includes(search.toLowerCase())

    const matchesType = typeFilter === 'all' || car.type === typeFilter
    const matchesStatus = statusFilter === 'all' || car.status === statusFilter

    return titleMatch && matchesType && matchesStatus
  })

  const openAddModal = () => {
    setEditingCar(null)
    setFormData({
      ...emptyCar,
      id: `car-${Date.now()}`,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (car: CarItem) => {
    setEditingCar(car)
    setFormData({ ...car })
    setIsModalOpen(true)
  }

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title?.ar && !formData.title?.en) {
      showToast('يرجى إدخال اسم السيارة بالعربية أو الإنجليزية', 'error')
      return
    }

    setIsSubmitting(true)
    const nextCars = editingCar
      ? cars.map((c) => (c.id === formData.id ? formData : c))
      : [formData, ...cars]

    const success = await persist('cars', nextCars)
    setIsSubmitting(false)

    if (success) {
      updateContent((prev) => ({ ...prev, cars: nextCars }))
      showToast(editingCar ? 'تم تحديث بيانات السيارة وحفظها بنجاح' : 'تمت إضافة السيارة الجديدة وحفظها في قاعدة البيانات')
      setIsModalOpen(false)
    } else {
      showToast('تعذر حفظ بيانات السيارة في قاعدة البيانات، يرجى المحاولة مرة أخرى', 'error')
    }
  }

  const handleDeleteCar = async (id: string) => {
    setIsDeleting(true)
    const result = await deleteResource('car', id)
    setIsDeleting(false)

    if (result.ok) {
      updateContent((prev) => ({ ...prev, cars: (prev.cars || []).filter((car) => car.id !== id) }))
      setDeleteConfirmId(null)
      showToast('تمت أرشفة السيارة وإخفاؤها مع الاحتفاظ بسجلها')
    } else {
      showToast('تعذرت أرشفة السيارة. تحقق من الصلاحية ثم حاول مجددًا', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.carsManager.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.carsManager.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => persist('cars', cars).then((ok) => {
              if (ok) showToast('تم حفظ أسطول السيارات في قاعدة البيانات بنجاح')
              else showToast('تعذر حفظ السيارات في قاعدة البيانات', 'error')
            })}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-primary" />}
            <span>حفظ الأسطول</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>{t.carsManager.addNewCar}</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.carsManager.searchPlaceholder}
            className="w-full rounded-xl border border-border bg-card ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="all">{t.carsManager.filterAll}</option>
            <option value="sale">{t.carsManager.filterSale}</option>
            <option value="import">{t.carsManager.filterImport}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="all">كافة الحالات</option>
            <option value="available">{t.carsManager.filterAvailable}</option>
            <option value="reserved">{t.carsManager.filterReserved}</option>
            <option value="sold">{t.carsManager.filterSold}</option>
            <option value="incoming">{t.carsManager.filterIncoming}</option>
          </select>
        </div>
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredCars.map((car) => {
          const carTitle = car.title?.[locale] || car.title?.ar || car.make
          const carDesc = car.description?.[locale] || car.description?.ar || ''

          return (
            <div
              key={car.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all hover:border-primary/50 hover:shadow-md"
            >
              {/* Image & Badges */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                <img
                  src={car.image}
                  alt={carTitle}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-2.5 start-2.5 flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      car.type === 'sale'
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {car.type === 'sale' ? 'بيع مباشر' : 'طلب استيراد'}
                  </span>
                  {car.featured && (
                    <span className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                      <Star className="h-3 w-3 fill-current" />
                      مميزة
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 end-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md ${
                      car.status === 'available'
                        ? 'bg-emerald-600/90 text-white'
                        : car.status === 'reserved'
                        ? 'bg-amber-600/90 text-white'
                        : car.status === 'sold'
                        ? 'bg-red-600/90 text-white'
                        : 'bg-sky-600/90 text-white'
                    }`}
                  >
                    {car.status === 'available'
                      ? 'متوفر'
                      : car.status === 'reserved'
                      ? 'محجوز'
                      : car.status === 'sold'
                      ? 'تم البيع'
                      : 'قادم قريباً'}
                  </span>
                </div>

                <div className="absolute bottom-2 end-2 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
                  {car.price.toLocaleString()} {car.currency}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {carTitle}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {carDesc}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                  <span>{car.year}</span>
                  <span>•</span>
                  <span>{car.fuel}</span>
                  <span>•</span>
                  <span>{car.mileage}</span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(car)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(car.id)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    title="حذف السيارة"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingCar ? t.carsManager.editCar : t.carsManager.addNewCar}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pe-1">
              {/* Multi-language Title */}
              <MultiLangInput
                label="اسم و��راز السيارة (Title)"
                value={formData.title}
                onChange={(v) => setFormData({ ...formData, title: v })}
                required
              />

              {/* Multi-language Description */}
              <MultiLangInput
                label="شرح ومواصفات السيارة (Description)"
                value={formData.description}
                onChange={(v) => setFormData({ ...formData, description: v })}
                textarea
                rows={3}
              />

              {/* Specs & Info */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.carsManager.typeLabel}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="sale">بيع مباشر (Sale)</option>
                    <option value="import">طلب استيراد (Import)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.carsManager.statusLabel}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="available">متوفرة (Available)</option>
                    <option value="reserved">محجوزة (Reserved)</option>
                    <option value="sold">تم البيع (Sold)</option>
                    <option value="incoming">قادمة قريباً (Incoming)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.carsManager.priceLabel}
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.carsManager.makeLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="مثال: Mercedes-Benz"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.carsManager.modelLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="مثال: Maybach S 680"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t.carsManager.yearLabel}
                  </label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value === '' ? new Date().getFullYear() : Number(e.target.value) })}
                    placeholder={String(new Date().getFullYear())}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Performance specs */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    المحرك والوقود
                  </label>
                  <input
                    type="text"
                    value={formData.fuel}
                    onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                    placeholder="مثال: Petrol V12 / Diesel"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    المسافة (Mileage)
                  </label>
                  <input
                    type="text"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="مثال: 0 كم"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    ناقل الحركة
                  </label>
                  <input
                    type="text"
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    placeholder="مثال: Automatic 9G-TRONIC"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Image Upload with file picker from device or URL */}
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                label={t.carsManager.imageLabel}
                aspectHint="16:9 موصى به للسيارات والشاحنات"
              />

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-toggle"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="featured-toggle" className="text-xs font-semibold text-foreground cursor-pointer">
                  {t.carsManager.featuredLabel}
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {t.carsManager.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'جاري الحفظ...' : t.carsManager.saveCar}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h4 className="text-sm font-bold text-foreground">
              {t.carsManager.deleteCar}
            </h4>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.carsManager.deleteConfirm}
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
                onClick={() => handleDeleteCar(deleteConfirmId)}
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
