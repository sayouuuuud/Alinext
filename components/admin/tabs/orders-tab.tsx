'use client'

import React, { useState } from 'react'
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Package,
  FileText,
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  Printer,
  ChevronRight,
  ExternalLink,
  Trash2,
  X,
  ShieldAlert,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import type { OrderRecord } from '@/lib/admin/types'

export function OrdersTab() {
  const { t, content, updateContent, showToast, dir } = useAdmin()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Edit form state in modal
  const [editStatus, setEditStatus] = useState<OrderRecord['status']>('pending')
  const [editCarrier, setEditCarrier] = useState('')
  const [editTracking, setEditTracking] = useState('')
  const [editDelivery, setEditDelivery] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editPaymentStatus, setEditPaymentStatus] = useState<OrderRecord['paymentStatus']>('paid')

  const orders = content.orders || []

  // Filter logic
  const filteredOrders = orders.filter((ord) => {
    const q = search.toLowerCase()
    const matchSearch =
      ord.id.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.customerPhone.toLowerCase().includes(q) ||
      ord.customerEmail.toLowerCase().includes(q) ||
      ord.shippingAddress?.city?.toLowerCase().includes(q) ||
      (ord.trackingNumber && ord.trackingNumber.toLowerCase().includes(q))

    const matchStatus = statusFilter === 'all' || ord.status === statusFilter

    return matchSearch && matchStatus
  })

  // Statistics calculation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const inTransitCount = orders.filter((o) => o.status === 'shipping' || o.status === 'processing').length
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length

  const handleOpenDetails = (order: OrderRecord) => {
    setSelectedOrder(order)
    setEditStatus(order.status)
    setEditCarrier(order.carrier || '')
    setEditTracking(order.trackingNumber || '')
    setEditDelivery(order.estimatedDelivery || '')
    setEditNotes(order.notes || '')
    setEditPaymentStatus(order.paymentStatus || 'paid')
    setIsModalOpen(true)
  }

  const handleQuickStatusChange = (orderId: string, newStatus: OrderRecord['status']) => {
    updateContent((prev) => ({
      ...prev,
      orders: prev.orders.map((ord) =>
        ord.id === orderId ? { ...ord, status: newStatus } : ord
      ),
    }))
    showToast(`تم تحديث حالة الطلب #${orderId} بنجاح`)
  }

  const handleSaveOrderModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    const updated: OrderRecord = {
      ...selectedOrder,
      status: editStatus,
      carrier: editCarrier.trim() || undefined,
      trackingNumber: editTracking.trim() || undefined,
      estimatedDelivery: editDelivery.trim() || undefined,
      notes: editNotes.trim() || undefined,
      paymentStatus: editPaymentStatus,
    }

    updateContent((prev) => ({
      ...prev,
      orders: prev.orders.map((ord) => (ord.id === updated.id ? updated : ord)),
    }))

    setSelectedOrder(updated)
    setIsModalOpen(false)
    showToast(`تم حفظ وتحديث بيانات الشحنة للطلب #${updated.id}`)
  }

  const handleDeleteOrder = (orderId: string) => {
    updateContent((prev) => ({
      ...prev,
      orders: prev.orders.filter((ord) => ord.id !== orderId),
    }))
    setDeleteConfirmId(null)
    showToast('تم حذف الطلب نهائياً')
  }

  const getStatusBadge = (status: OrderRecord['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: t.orders.statusPending,
          bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          icon: Clock,
        }
      case 'confirmed':
        return {
          label: t.orders.statusConfirmed,
          bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          icon: CheckCircle2,
        }
      case 'processing':
        return {
          label: t.orders.statusProcessing,
          bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
          icon: Package,
        }
      case 'shipping':
        return {
          label: t.orders.statusShipping,
          bg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 animate-pulse',
          icon: Truck,
        }
      case 'delivered':
        return {
          label: t.orders.statusDelivered,
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          icon: CheckCircle2,
        }
      case 'cancelled':
        return {
          label: t.orders.statusCancelled,
          bg: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: XCircle,
        }
      default:
        return {
          label: status,
          bg: 'bg-muted text-muted-foreground border-border',
          icon: Clock,
        }
    }
  }

  const getPaymentBadge = (status: OrderRecord['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">مدفوع</span>
      case 'unpaid':
        return <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-500">غير مدفوع (COD)</span>
      case 'refunded':
        return <span className="rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive">مسترد</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t.orders.title}
            </h1>
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
              {orders.length} طلب
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.orders.subtitle}
          </p>
        </div>

        {/* Quick link to live customer tracking test */}
        <a
          href="/track-order"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          <ExternalLink className="size-3.5" />
          <span>فتح صفحة تتبع الطلب للعميل</span>
        </a>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">إجمالي المبيعات</span>
            <DollarSign className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-xl font-black tracking-tight text-foreground">
            {totalRevenue.toLocaleString()} ₪
          </p>
          <span className="text-[11px] text-muted-foreground">إجمالي قيمة كافة الطلبات</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">طلبات جديدة</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-xl font-black tracking-tight text-amber-500">
            {pendingCount}
          </p>
          <span className="text-[11px] text-muted-foreground">تتطلب المراجعة والتأكيد</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">قيد التجهيز والشحن</span>
            <Truck className="size-4 text-cyan-500" />
          </div>
          <p className="mt-2 text-xl font-black tracking-tight text-cyan-500">
            {inTransitCount}
          </p>
          <span className="text-[11px] text-muted-foreground">جاري فحصها ونقلها للعميل</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">تم التسليم بنجاح</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-black tracking-tight text-emerald-500">
            {deliveredCount}
          </p>
          <span className="text-[11px] text-muted-foreground">شحنات مكتملة بالكامل</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.orders.searchPlaceholder}
            className="w-full rounded-xl border border-border bg-card ps-9 pe-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card/60 p-1">
          {[
            { id: 'all', label: t.orders.filterAll },
            { id: 'pending', label: t.orders.filterPending },
            { id: 'processing', label: t.orders.filterProcessing },
            { id: 'shipping', label: t.orders.filterShipping },
            { id: 'delivered', label: t.orders.filterDelivered },
            { id: 'cancelled', label: t.orders.filterCancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-foreground">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t.orders.orderNumber}</th>
                <th className="px-4 py-3 text-start">{t.orders.customer}</th>
                <th className="px-4 py-3 text-start">{t.orders.orderedItems}</th>
                <th className="px-4 py-3 text-start">{t.orders.totalAmount}</th>
                <th className="px-4 py-3 text-start">{t.orders.paymentStatus}</th>
                <th className="px-4 py-3 text-start">{t.orders.orderStatus}</th>
                <th className="px-4 py-3 text-start">الشحن والتتبع</th>
                <th className="px-4 py-3 text-end">{t.orders.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  const StatusIcon = badge.icon
                  const itemsSummary = order.items.map((it) => `${it.title} (${it.quantity})`).join('، ')

                  return (
                    <tr key={order.id} className="transition-colors hover:bg-muted/20">
                      {/* Order Number */}
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(order)}
                          className="hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <ShoppingBag className="size-3.5 text-primary" />
                          <span>#{order.id}</span>
                        </button>
                        <span className="block text-[10px] text-muted-foreground font-sans">
                          {new Date(order.date).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <a
                            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-500 hover:underline font-mono"
                          >
                            <Phone className="size-2.5" />
                            <span>{order.customerPhone}</span>
                          </a>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="truncate font-medium text-foreground" title={itemsSummary}>
                          {itemsSummary}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {order.items.length} أصناف
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                        {order.total.toLocaleString()} {order.currency || '₪'}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          {getPaymentBadge(order.paymentStatus)}
                          <span className="block text-[10px] text-muted-foreground uppercase">
                            {order.paymentMethod === 'card' ? 'بطاقة ائتمان' : order.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'عند الاستلام'}
                          </span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleQuickStatusChange(order.id, e.target.value as OrderRecord['status'])}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-hidden ${badge.bg}`}
                        >
                          <option value="pending">{t.orders.statusPending}</option>
                          <option value="confirmed">{t.orders.statusConfirmed}</option>
                          <option value="processing">{t.orders.statusProcessing}</option>
                          <option value="shipping">{t.orders.statusShipping}</option>
                          <option value="delivered">{t.orders.statusDelivered}</option>
                          <option value="cancelled">{t.orders.statusCancelled}</option>
                        </select>
                      </td>

                      {/* Tracking / Carrier */}
                      <td className="px-4 py-3">
                        {order.trackingNumber ? (
                          <div className="font-mono text-xs">
                            <span className="font-semibold text-primary">{order.trackingNumber}</span>
                            <span className="block text-[10px] text-muted-foreground font-sans">
                              {order.carrier || 'ناقل معتمد'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">لم يُعيّن كود بعد</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(order)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
                            title={t.orders.viewDetails}
                          >
                            <Eye className="size-3.5 text-primary" />
                            <span>تفاصيل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="حذف الطلب"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                    <ShoppingBag className="mx-auto size-10 text-muted-foreground/40 mb-2" />
                    {t.orders.emptyState}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS & EDIT MODAL */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    تفاصيل الفاتورة والطلب #{selectedOrder.id}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    تاريخ الإنشاء: {new Date(selectedOrder.date).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <Printer className="size-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer & Destination Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-border bg-muted/20 p-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Phone className="size-3.5 text-primary" />
                    بيانات العميل
                  </h4>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-foreground">{selectedOrder.customerName}</p>
                    <p className="text-muted-foreground">{selectedOrder.customerEmail}</p>
                    <p className="font-mono text-primary">{selectedOrder.customerPhone}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Truck className="size-3.5 text-primary" />
                    عنوان التسليم والشحن
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="text-foreground">{selectedOrder.shippingAddress?.street}</p>
                    <p>{selectedOrder.shippingAddress?.city}، {selectedOrder.shippingAddress?.country}</p>
                    {selectedOrder.shippingAddress?.postalCode && (
                      <p>الرمز البريدي: {selectedOrder.shippingAddress.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground">
                  القطع والمركبات المطلوبة ({selectedOrder.items.length})
                </h4>
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-card hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.title}
                            className="size-12 rounded-lg object-contain bg-muted border border-border p-1"
                          />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded-lg bg-muted border border-border text-muted-foreground">
                            <Package className="size-6" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-foreground">{item.title}</div>
                          {item.sku && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              SKU: {item.sku}
                            </span>
                          )}
                          <div className="text-[11px] text-muted-foreground">
                            {item.price.toLocaleString()} ₪ × {item.quantity} وحدة
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-black text-foreground">
                        {(item.price * item.quantity).toLocaleString()} ₪
                      </div>
                    </div>
                  ))}

                  {/* Summary row */}
                  <div className="flex items-center justify-between bg-muted/40 p-3 font-bold text-xs text-foreground">
                    <span>الإجمالي المستحق</span>
                    <span className="text-sm font-black text-primary">
                      {selectedOrder.total.toLocaleString()} {selectedOrder.currency || '₪'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Fulfillment Update Form */}
              <form onSubmit={handleSaveOrderModal} className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  تحديث حالة الطلب ومراحل الشحن (يظهر للعميل فوراً عند التتبع)
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      حالة الطلب الحالية
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OrderRecord['status'])}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="pending">1. قيد المراجعة والتأكيد</option>
                      <option value="confirmed">2. تم تأكيد الطلب</option>
                      <option value="processing">3. قيد التجهيز والفحص الفني</option>
                      <option value="shipping">4. جاري الشحن والتوصيل (في الطريق)</option>
                      <option value="delivered">5. تم التسليم بنجاح للعميل</option>
                      <option value="cancelled">6. ملغي</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      حالة الدفع
                    </label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as OrderRecord['paymentStatus'])}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      <option value="paid">مدفوع بالكامل (Paid)</option>
                      <option value="unpaid">غير مدفوع / عند الاستلام (Unpaid)</option>
                      <option value="refunded">مسترد للعميل (Refunded)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      شركة الشحن / الناقل
                    </label>
                    <input
                      type="text"
                      value={editCarrier}
                      onChange={(e) => setEditCarrier(e.target.value)}
                      placeholder="مثال: Aramex, DHL, أسطول علي فليت"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      رقم التتبع (Tracking Number)
                    </label>
                    <input
                      type="text"
                      value={editTracking}
                      onChange={(e) => setEditTracking(e.target.value)}
                      placeholder="مثال: ARX-982147"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      موعد الوصول المتوقع
                    </label>
                    <input
                      type="date"
                      value={editDelivery}
                      onChange={(e) => setEditDelivery(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    ملاحظات الشحنة والإدارة
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="ملاحظات التسليم، توجيهات السائق، أي تفاصيل إضافية…"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>حفظ وتحديث حالة الطلب</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">تأكيد حذف الطلب</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لن يتمكن العميل من تتبعه بعد الحذف.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(deleteConfirmId)}
                className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:opacity-95"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
