'use client'

import React, { useState } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Shield,
  Crown,
  Sparkles,
  ShoppingBag,
  MapPin,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  X,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import type { CustomerItem, CustomerOrder } from '@/lib/admin/types'

export function CustomersTab() {
  const { t, content, updateContent, persist, deleteResource, showToast } = useAdmin()

  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null)
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'addresses' | 'orders'>('profile')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const emptyCustomer: CustomerItem = {
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: '',
    tier: 'Regular',
    status: 'active',
    joinedDate: new Date().toISOString().slice(0, 10),
    billingAddress: {
      street: '',
      city: '',
      country: '',
      postalCode: '',
    },
    shippingAddress: {
      street: '',
      city: '',
      country: '',
    },
    totalSpent: 0,
    ordersCount: 0,
    interestedIn: '',
    notes: '',
    orders: [],
  }

  const [formData, setFormData] = useState<CustomerItem>(emptyCustomer)

  const customers = content.customers || []

  // Filtered customers
  const filteredCustomers = customers.filter((cust) => {
    const searchLower = search.toLowerCase()
    const nameMatch =
      cust.name.toLowerCase().includes(searchLower) ||
      cust.email.toLowerCase().includes(searchLower) ||
      cust.phone.includes(search) ||
      cust.billingAddress?.city?.toLowerCase().includes(searchLower)

    const matchesTier = tierFilter === 'all' || cust.tier === tierFilter
    const matchesStatus = statusFilter === 'all' || cust.status === statusFilter

    return nameMatch && matchesTier && matchesStatus
  })

  const openAddModal = () => {
    setEditingCustomer(null)
    setFormData({
      ...emptyCustomer,
      id: `cust-${Date.now()}`,
    })
    setActiveModalTab('profile')
    setIsModalOpen(true)
  }

  const openEditModal = (cust: CustomerItem) => {
    setEditingCustomer(cust)
    setFormData({ ...cust })
    setActiveModalTab('profile')
    setIsModalOpen(true)
  }

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('يرجى إدخال اسم العميل وبريده الإلكتروني', 'error')
      return
    }

    const nextCustomers = editingCustomer
      ? customers.map((customer) => customer.id === formData.id ? formData : customer)
      : [formData, ...customers]
    const success = await persist('customers', nextCustomers)
    if (!success) {
      showToast('تعذر حفظ بيانات العميل في قاعدة البيانات', 'error')
      return
    }

    updateContent((prev) => ({ ...prev, customers: nextCustomers }))
    showToast(editingCustomer ? 'تم تحديث بيانات العميل بنجاح' : 'تمت إضافة العميل الجديد بنجاح')
    setIsModalOpen(false)
  }

  const handleDeleteCustomer = async (id: string) => {
    const result = await deleteResource('customer', id)
    if (result.ok) {
      updateContent((prev) => ({
        ...prev,
        customers: (prev.customers || []).filter((customer) => customer.id !== id),
      }))
      setDeleteConfirmId(null)
      showToast('تم حذف حساب العميل غير المرتبط بطلبات')
      return
    }
    const message = result.error === 'customer_has_orders'
      ? 'لا يمكن حذف العميل لأن لديه سجل طلبات. يمكنك تعليق الحساب بدلًا من ذلك.'
      : result.error === 'customer_is_admin'
        ? 'لا يمكن حذف هذا الحساب لأنه يملك عضوية إدارة.'
        : 'تعذر حذف حساب العميل. تحقق من الصلاحية ثم حاول مجددًا.'
    showToast(message, 'error')
  }

  const getTierBadge = (tier: CustomerItem['tier']) => {
    switch (tier) {
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Crown className="h-3 w-3" />
            VIP Elite
          </span>
        )
      case 'Platinum':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Sparkles className="h-3 w-3" />
            Platinum
          </span>
        )
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-[11px] font-bold text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
            Gold
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
            Regular
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.customers.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.customers.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>{t.customers.addNewCustomer}</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.customers.searchPlaceholder}
            className="w-full rounded-xl border border-border bg-card ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="all">{t.customers.filterAllTiers}</option>
            <option value="VIP">{t.customers.filterVip}</option>
            <option value="Platinum">{t.customers.filterPlatinum}</option>
            <option value="Gold">{t.customers.filterGold}</option>
            <option value="Regular">{t.customers.filterRegular}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="all">{t.customers.filterAllStatus}</option>
            <option value="active">{t.customers.filterActive}</option>
            <option value="suspended">{t.customers.filterSuspended}</option>
            <option value="pending">{t.customers.filterPending}</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-border/80 bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">العميل / الحساب</th>
                <th className="px-4 py-3 text-start">التصنيف</th>
                <th className="px-4 py-3 text-start">بيانات الاتصال</th>
                <th className="px-4 py-3 text-start">إجمالي المشتريات</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t.customers.emptyState}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const cleanPhone = cust.phone.replace(/[^\d]/g, '')

                  return (
                    <tr key={cust.id} className="hover:bg-muted/20 transition-colors">
                      {/* Customer info & avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {cust.avatar ? (
                            <img
                              src={cust.avatar}
                              alt={cust.name}
                              className="h-10 w-10 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {cust.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-foreground text-xs">
                              {cust.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              انضم في: {cust.joinedDate}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3">{getTierBadge(cust.tier)}</td>

                      {/* Contact Channels */}
                      <td className="px-4 py-3 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                          <Phone className="h-3 w-3 text-primary" />
                          <span>{cust.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{cust.email}</span>
                        </div>
                      </td>

                      {/* Total Spent & Orders */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-primary text-xs">
                          {cust.totalSpent.toLocaleString()} ₪
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {cust.ordersCount} طلبات سابقة
                        </p>
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cust.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : cust.status === 'suspended'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {cust.status === 'active' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : cust.status === 'suspended' ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {cust.status === 'active'
                            ? 'نشط'
                            : cust.status === 'suspended'
                            ? 'معلّق'
                            : 'قيد المراجعة'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-emerald-500/30 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              title="محادثة واتساب"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:text-primary"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(cust.id)}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            title="حذف العميل"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile & Account Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {editingCustomer ? t.customers.editCustomer : t.customers.addNewCustomer}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Internal Tabs */}
            <div className="mt-3 flex border-b border-border bg-muted/30 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveModalTab('profile')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  activeModalTab === 'profile'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                البيانات الشخصية والحساب
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('addresses')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  activeModalTab === 'addresses'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                عناوين الشحن والفوترة
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('orders')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  activeModalTab === 'orders'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                سجل الطلبات ({formData.orders?.length || 0})
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pe-1">
              {/* TAB 1: PROFILE & PERSONAL */}
              {activeModalTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t.customers.nameLabel} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="الاسم الكامل أو اسم الشركة"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t.customers.emailLabel}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@example.com"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t.customers.phoneLabel}
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+972 50 123 4567"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t.customers.tierLabel}
                      </label>
                      <select
                        value={formData.tier}
                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                      >
                        <option value="VIP">VIP Elite</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Gold">Gold</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t.customers.statusLabel}
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                      >
                        <option value="active">نشط (Active)</option>
                        <option value="suspended">معلّق (Suspended)</option>
                        <option value="pending">قيد المراجعة (Pending)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      رابط الصورة الشخصية (Avatar URL)
                    </label>
                    <input
                      type="url"
                      value={formData.avatar || ''}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      {t.customers.interestedInLabel}
                    </label>
                    <input
                      type="text"
                      value={formData.interestedIn || ''}
                      onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                      placeholder="مثال: مرسيدس مايباخ، مقصورات VIP خاصة"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      {t.customers.notesLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="ملاحظات سرية حول اهتمامات العميل، طريقة الدفع المفضلة، أو مواعيد الاتصال…"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ADDRESSES */}
              {activeModalTab === 'addresses' && (
                <div className="space-y-4">
                  {/* Billing Address */}
                  <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{t.customers.billingAddress}</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted-foreground">الشارع والحي</label>
                        <input
                          type="text"
                          value={formData.billingAddress?.street || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingAddress: {
                                ...formData.billingAddress,
                                street: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">المدينة</label>
                        <input
                          type="text"
                          value={formData.billingAddress?.city || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingAddress: {
                                ...formData.billingAddress,
                                city: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted-foreground">الدولة</label>
                        <input
                          type="text"
                          value={formData.billingAddress?.country || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingAddress: {
                                ...formData.billingAddress,
                                country: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">الرمز البريدي</label>
                        <input
                          type="text"
                          value={formData.billingAddress?.postalCode || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingAddress: {
                                ...formData.billingAddress,
                                postalCode: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span>{t.customers.shippingAddress}</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted-foreground">عنوان التسليم / الميناء</label>
                        <input
                          type="text"
                          value={formData.shippingAddress?.street || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: {
                                ...formData.shippingAddress,
                                street: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">المدينة والدولة</label>
                        <input
                          type="text"
                          value={formData.shippingAddress?.city || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: {
                                ...formData.shippingAddress,
                                city: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ORDER HISTORY */}
              {activeModalTab === 'orders' && (
                <div className="space-y-3">
                  {(!formData.orders || formData.orders.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                      {t.customers.noOrders}
                    </div>
                  ) : (
                    formData.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="rounded-xl border border-border bg-background/60 p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary">
                            {ord.orderNumber}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              ord.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : ord.status === 'processing'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {ord.status === 'completed'
                              ? 'مكتمل'
                              : ord.status === 'processing'
                              ? 'قيد التجهيز'
                              : ord.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{ord.date}</span>
                          <span className="font-bold text-foreground">
                            {ord.total.toLocaleString()} ₪
                          </span>
                        </div>

                        <div className="border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              <span>{item.price.toLocaleString()} ₪</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {t.customers.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
                >
                  {t.customers.saveCustomer}
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
              {t.customers.deleteCustomer}
            </h4>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.customers.deleteConfirm}
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
                onClick={() => handleDeleteCustomer(deleteConfirmId)}
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
