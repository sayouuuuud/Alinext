'use client'

import React, { useState } from 'react'
import {
  LayoutDashboard,
  Layers,
  Car,
  Package,
  FileText,
  ShoppingBag,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useAdmin, type AdminTab } from '@/lib/admin/admin-context'

export function AdminSidebar() {
  const { t, activeTab, setActiveTab, content, dir } = useAdmin()
  const [collapsed, setCollapsed] = useState(false)

  const pendingOrdersCount =
    content.orders?.filter((o) => o.status === 'pending').length || 0

  const navItems: {
    id: AdminTab
    label: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number | string
    badgeColor?: string
  }[] = [
    {
      id: 'dashboard',
      label: t.tabs.dashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'pages',
      label: t.tabs.pages,
      icon: Layers,
    },
    {
      id: 'cars',
      label: t.tabs.cars,
      icon: Car,
      badge: content.cars?.length || 0,
      badgeColor: 'bg-primary/20 text-primary',
    },
    {
      id: 'products',
      label: t.tabs.products,
      icon: Package,
      badge: content.products?.length || 0,
      badgeColor: 'bg-muted text-muted-foreground',
    },
    {
      id: 'blog',
      label: t.tabs.blog,
      icon: FileText,
      badge: content.blog?.length || 0,
    },
    {
      id: 'orders',
      label: t.tabs.orders,
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : (content.orders?.length || 0),
      badgeColor: pendingOrdersCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-muted text-muted-foreground',
    },
    {
      id: 'customers',
      label: t.tabs.customers,
      icon: Users,
      badge: content.customers?.length || 0,
      badgeColor: 'bg-primary/20 text-primary',
    },
    {
      id: 'settings',
      label: t.tabs.settings,
      icon: Settings,
    },
  ]

  return (
    <aside
      className={`relative flex flex-col border-e border-border bg-card transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute -end-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-transform hover:bg-muted ${
          dir === 'rtl' ? 'rotate-180' : ''
        }`}
        title={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-background' : 'text-accent'
                }`}
              />

              {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate text-start">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ms-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-background/15 text-background'
                          : item.badgeColor || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Info Box */}
      {!collapsed && (
        <div className="p-3.5 m-3 rounded-2xl bg-secondary">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-semibold text-foreground">
              ALI FLEET Engine
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            نظام إدارة فوري ومزود بـ 3 لغات (AR, HE, EN)
          </p>
        </div>
      )}
    </aside>
  )
}
