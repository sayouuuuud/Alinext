'use client'

import React, { useMemo, useState } from 'react'
import {
  Car,
  Package,
  FileText,
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  Zap,
  Clock,
  Plus,
  FolderTree,
  Users,
  AlertTriangle,
  CheckCircle2,
  Check,
  Fuel,
  DollarSign,
  Layers,
  ArrowRight,
  Sparkles,
  BarChart3,
  Percent,
  RefreshCw,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'

export function DashboardTab() {
  const { t, content, summary, setActiveTab, updateContent, persist, showToast, locale } = useAdmin()

  const cars = content.cars || []
  const products = content.products || []
  const categories = content.categories || []
  const blog = content.blog || []
  const inquiries = content.inquiries || []

  // Fast replenish loading state
  const [replenishingId, setReplenishingId] = useState<string | null>(null)

  // 1. Calculations: Financials & Orders
  const totalRevenue = summary?.orders.revenue ?? 0
  const aov = summary?.orders.average ?? 0

  // 2. Calculations: Fleet & Showroom
  const calculatedFleetValue = useMemo(() => {
    return cars.reduce((sum, c) => sum + (Number(c.price) || 0), 0)
  }, [cars])
  const totalFleetValue = summary?.cars.value ?? calculatedFleetValue

  const availableCars = cars.filter((c) => c.status === 'available')
  const reservedCars = cars.filter((c) => c.status === 'reserved')
  const soldCars = cars.filter((c) => c.status === 'sold')
  const incomingCars = cars.filter((c) => c.status === 'incoming')

  const saleCarsCount = cars.filter((c) => c.type === 'sale').length
  const importCarsCount = cars.filter((c) => c.type === 'import').length

  // Cars fuel breakdown
  const fuelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of cars) {
      const fuel = c.fuel?.trim() || 'أخرى'
      counts[fuel] = (counts[fuel] || 0) + 1
    }
    return counts
  }, [cars])

  // 3. Calculations: Inventory & Categories
  const inStockProducts = products.filter((p) => p.inStock)
  const outOfStockProducts = products.filter((p) => !p.inStock)

  const mainCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories])
  const subCategories = useMemo(() => categories.filter((c) => !!c.parentId), [categories])

  // Product distribution across main categories
  const categoryDistribution = useMemo(() => {
    const map: Record<string, { name: string; count: number; color: string }> = {}
    const colors = [
      'bg-primary',
      'bg-accent',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-rose-500',
      'bg-cyan-500',
    ]

    mainCategories.forEach((main, idx) => {
      map[main.id] = {
        name: main.name?.[locale] || main.name?.ar || main.name?.en || main.id,
        count: 0,
        color: colors[idx % colors.length],
      }
    })

    products.forEach((p) => {
      const targetId = p.categoryId || p.category
      const cat = categories.find((c) => c.id === targetId || c.slug === targetId)
      const mainId = cat?.parentId ? cat.parentId : cat?.id

      if (mainId && map[mainId]) {
        map[mainId].count += 1
      }
    })

    return Object.values(map)
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [mainCategories, categories, products, locale])

  // 4. Inquiries & Leads
  const newInquiries = inquiries.filter((i) => i.status === 'new')
  const resolvedInquiries = inquiries.filter((i) => i.status === 'resolved')

  // Quick action: Fast replenish out-of-stock product
  const handleQuickRestock = async (product: (typeof products)[0]) => {
    setReplenishingId(product.id)
    const updated = { ...product, inStock: true }
    const nextProducts = products.map((p) => (p.id === product.id ? updated : p))
    const success = await persist('products', nextProducts)
    setReplenishingId(null)

    if (success) {
      updateContent((prev) => ({ ...prev, products: nextProducts }))
      showToast(`تم تعيين القطعة "${product.name?.[locale] || product.sku}" كمتوفرة بالمخزون بنجاح`)
    } else {
      showToast('تعذر تحديث المخزون', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner — Executive Hub */}
      <div className="relative overflow-hidden rounded-3xl bg-card p-6 ring-1 ring-border sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" />
              <span>ALI FLEET Executive Command Center</span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              لوحة التحكم والإحصائيات الشاملة
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              متابعة حية وفورية لأداء الأسطول، مبيعات قطع الغيار، سلامة المخزون، ونشاط العملاء بكافة التفاصيل.
            </p>

            {/* Quick Action Shortcuts */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('cars')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-bold text-background shadow-xs hover:opacity-90 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة سيارة</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                <Package className="h-3.5 w-3.5 text-accent" />
                <span>إضافة قطعة غيار</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                <FolderTree className="h-3.5 w-3.5 text-primary" />
                <span>إدارة التصنيفات ({categories.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />
                <span>الطلبات والشحن ({summary?.orders.pending ?? 0} جديدة)</span>
              </button>
            </div>
          </div>

          {/* Mini Realtime Status Pill */}
          <div className="hidden lg:flex flex-col gap-2 rounded-2xl border border-border bg-background/80 p-4 shrink-0 min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>حالة النظام والبيانات</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-foreground">قاعدة البيانات متصلة ومحدثة</p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/60">
              <span>آخر مزامنة سحابية</span>
              <span className="font-mono">الآن</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (6 High-Impact Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Total Revenue */}
        <div
          onClick={() => setActiveTab('orders')}
          className="group cursor-pointer rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">إجمالي الإيرادات</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">
              {totalRevenue > 0 ? `${totalRevenue.toLocaleString()} ₪` : '0 ₪'}
            </span>
            <p className="mt-1 text-[11px] text-muted-foreground">
              متوسط الطلب: {aov.toLocaleString()} ₪
            </p>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          onClick={() => setActiveTab('orders')}
          className="group cursor-pointer rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">إجمالي الطلبات</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
<span className="text-2xl font-black text-foreground">{summary?.orders.total ?? 0}</span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {summary?.orders.pending ?? 0} معلق • {summary?.orders.processing ?? 0} تجهيز
            </p>
          </div>
        </div>

        {/* 3. Fleet Valuation & Cars */}
        <div
          onClick={() => setActiveTab('cars')}
          className="group cursor-pointer rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">أسطول المعرض</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Car className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{summary?.cars.total ?? cars.length}</span>
            <p className="mt-1 text-[11px] text-muted-foreground">
              قيمة المعرض: {(totalFleetValue / 1000).toFixed(0)} ألف ₪
            </p>
          </div>
        </div>

        {/* 4. Products & Stock Health */}
        <div
          onClick={() => setActiveTab('products')}
          className="group cursor-pointer rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">قطع الغيار</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
<span className="text-2xl font-black text-foreground">{summary?.products.total ?? products.length}</span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {summary?.products.inStock ?? inStockProducts.length} متوفر • {summary?.products.outOfStock ?? outOfStockProducts.length} نفد
            </p>
          </div>
        </div>

        {/* 5. Categories & Taxonomy */}
        <div
          onClick={() => setActiveTab('categories')}
          className="group cursor-pointer rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">التصنيفات والأنواع</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FolderTree className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
<span className="text-2xl font-black text-foreground">{summary?.categories.total ?? categories.length}</span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {summary?.categories.main ?? mainCategories.length} رئيسي • {summary?.categories.sub ?? subCategories.length} فرعي
            </p>
          </div>
        </div>

        {/* 6. Customers & Inquiries */}
        <div
          onClick={() => setActiveTab('customers')}
          className="group cursor-pointer rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">العملاء والطلبات</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
<span className="text-2xl font-black text-foreground">{summary?.customers ?? 0}</span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {summary?.inquiries.new ?? newInquiries.length} استفسار جديد بانتظار الرد
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Inventory Alert Banner (if any out of stock) */}
      {outOfStockProducts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  تنبيه المخزون الحرج ({outOfStockProducts.length} قطع غير متوفرة)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  يرجى إعادة تزويد المخزون أو تعيين الحالة لتجنب توقف طلبات العملاء
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
            >
              عرض الكتالوج الكامل ←
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {outOfStockProducts.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={item.image}
                    alt={item.sku}
                    className="h-9 w-9 rounded-lg object-cover border border-border/80 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.name?.[locale] || item.name?.ar || item.sku}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {item.sku} • {item.price} ₪
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickRestock(item)}
                  disabled={replenishingId === item.id}
                  className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors shrink-0 ms-2"
                  title="إعادة توفير بالمخزون"
                >
                  {replenishingId === item.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <span>+ توفير</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Category Distribution & Fleet Composition Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Products Category Distribution (Visual Bar Chart) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>توزيع المنتجات حسب التصنيفات الرئيسية</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                نسبة قطع الغيار والكتالوج لكل قسم رئيسي
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              إدارة التصنيفات ({mainCategories.length})
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {/* Visual Stacked Progress Bar */}
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
              {categoryDistribution.map((item, idx) => {
                const pct = products.length > 0 ? (item.count / products.length) * 100 : 0
                return (
                  <div
                    key={idx}
                    style={{ width: `${pct}%` }}
                    className={`${item.color} h-full transition-all`}
                    title={`${item.name}: ${item.count} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
            </div>

            {/* List breakdown with counts */}
            <div className="mt-4 divide-y divide-border/60 max-h-56 overflow-y-auto pe-1">
              {categoryDistribution.map((item, idx) => {
                const pct = products.length > 0 ? Math.round((item.count / products.length) * 100) : 0
                return (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{item.count} قطعة</span>
                      <span className="font-mono font-bold text-foreground min-w-[35px] text-end">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Fleet Showroom Analytics */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Car className="h-4 w-4 text-accent" />
                <span>تحليلات أسطول السيارات والمعرض</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                توزيع حالة المعروض وأنواع الوقود
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('cars')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              عرض الأسطول ({cars.length})
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Status Pills */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-border bg-background p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground block">متوفر</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {summary?.cars.available ?? availableCars.length}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground block">محجوز</span>
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {summary?.cars.reserved ?? reservedCars.length}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground block">تم البيع</span>
                <span className="text-base font-extrabold text-muted-foreground">
                  {summary?.cars.sold ?? soldCars.length}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground block">قيد الاستيراد</span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {summary?.cars.incoming ?? incomingCars.length}
                </span>
              </div>
            </div>

            {/* Fuel Type Distribution */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                <Fuel className="h-3.5 w-3.5 text-primary" />
                <span>أنواع الوقود والمحركات في الأسطول</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fuelCounts).map(([fuel, count]) => (
                  <span
                    key={fuel}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs"
                  >
                    <span>{fuel}</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-bold">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick summary line */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
              <span>نوع المعروض: {saleCarsCount} بيع فوري بالمعرض</span>
              <span>{importCarsCount} طلبات استيراد مخصصة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Two Columns - Recent Fleet Vehicles & Recent Inquiries/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Showroom Snapshot */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                أحدث سيارات المعرض
              </h2>
              <p className="text-xs text-muted-foreground">
                السيارات المضافة مؤخراً في واجهة العرض
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('cars')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              عرض الكل ({cars.length})
            </button>
          </div>

          <div className="mt-4 divide-y divide-border/60">
            {cars.slice(0, 4).map((car) => {
              const carTitle = car.title?.[locale] || car.title?.ar || car.make
              return (
                <div key={car.id} className="flex items-center gap-3 py-3">
                  <img
                    src={car.image}
                    alt={carTitle}
                    className="h-12 w-16 rounded-xl object-cover border border-border/80 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{carTitle}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {car.year} • {car.fuel} • {car.type === 'sale' ? 'بيع مباشر' : 'استيراد'}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs font-bold text-primary">
                      {car.price.toLocaleString()} {car.currency}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        car.status === 'available'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : car.status === 'reserved'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {car.status === 'available' ? 'متوفر' : car.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Recent Inquiries & Customer Pulse */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                أحدث الاستفسارات والطلبات الواردة
              </h2>
              <p className="text-xs text-muted-foreground">
                رسائل العملاء وطلبات الشراء والاستيراد
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              عرض الكل ({inquiries.length})
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {inquiries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                لا توجد استفسارات جديدة حالياً
              </p>
            ) : (
              inquiries.slice(0, 4).map((inq) => (
                <div
                  key={inq.id}
                  className="rounded-xl border border-border/80 bg-background/50 p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{inq.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          inq.status === 'new'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {inq.status === 'new' ? 'جديد' : inq.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {inq.date || 'اليوم'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-primary">{inq.service}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {inq.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
