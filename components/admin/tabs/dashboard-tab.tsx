'use client'

import React from 'react'
import {
  Car,
  Package,
  FileText,
  Mail,
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  Plus,
  Edit3,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'

export function DashboardTab() {
  const { t, content, setActiveTab, locale } = useAdmin()

  const cars = content.cars || []
  const products = content.products || []
  const blog = content.blog || []
  const inquiries = content.inquiries || []

  const availableCars = cars.filter((c) => c.status === 'available').length
  const saleCars = cars.filter((c) => c.type === 'sale').length
  const importCars = cars.filter((c) => c.type === 'import').length
  const newInquiries = inquiries.filter((i) => i.status === 'new').length

  const stats = [
    {
      title: t.dashboard.totalCars,
      value: cars.length,
      sub: `${saleCars} للبيع • ${importCars} استيراد`,
      icon: Car,
      color: 'from-blue-600 to-indigo-600',
      tab: 'cars' as const,
    },
    {
      title: t.dashboard.totalProducts,
      value: products.length,
      sub: `${products.filter((p) => p.inStock).length} متوفر بالمخزون`,
      icon: Package,
      color: 'from-teal-600 to-emerald-600',
      tab: 'products' as const,
    },
    {
      title: t.dashboard.totalArticles,
      value: blog.length,
      sub: 'منشور ومفهرس بالكامل',
      icon: FileText,
      color: 'from-purple-600 to-pink-600',
      tab: 'blog' as const,
    },
    {
      title: 'إجمالي الطلبات والشحنات',
      value: (content.orders || []).length,
      sub: `${(content.orders || []).filter((o) => o.status === 'processing' || o.status === 'pending').length} قيد المعالجة`,
      icon: ShoppingBag,
      color: 'from-amber-500 to-orange-600',
      tab: 'orders' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Zap className="h-3.5 w-3.5" />
            <span>ALI FLEET Control Hub v2.0</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.dashboard.welcome}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t.dashboard.welcomeSub}
          </p>

          {/* Quick Shortcuts */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('cars')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30 hover:opacity-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.dashboard.addCar}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pages')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Edit3 className="h-3.5 w-3.5 text-primary" />
              <span>{t.dashboard.editHome}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Package className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t.dashboard.addProduct}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              onClick={() => setActiveTab(stat.tab)}
              className="group cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">
                  {stat.value}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{stat.sub}</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout: Fleet Snapshot & Recent Inquiries */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Top Vehicles in Showroom */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {t.dashboard.carsOverview}
              </h2>
              <p className="text-xs text-muted-foreground">
                أحدث سيارات الأسطول المعروضة حالياً
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
                    className="h-12 w-16 rounded-lg object-cover border border-border/60"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {carTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {car.year} • {car.fuel} • {car.type === 'sale' ? 'بيع مباشر' : 'طلب استيراد'}
                    </p>
                  </div>
                  <div className="text-end">
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

        {/* Right: Recent Inquiries */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {t.dashboard.recentInquiries}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t.dashboard.recentInquiriesSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              عرض الكل ({inquiries.length})
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {inquiries.slice(0, 4).map((inq) => (
              <div
                key={inq.id}
                className="rounded-xl border border-border/70 bg-background/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {inq.name}
                    </span>
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
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {inq.date}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-primary">
                  {inq.service}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {inq.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
