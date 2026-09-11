'use client'

import React from 'react'
import { useAdmin } from '@/lib/admin/admin-context'
import { DashboardTab } from '@/components/admin/tabs/dashboard-tab'
import { PagesEditorTab } from '@/components/admin/tabs/pages-editor-tab'
import { CarsManagerTab } from '@/components/admin/tabs/cars-manager-tab'
import { ProductsManagerTab } from '@/components/admin/tabs/products-manager-tab'
import { CategoriesManagerTab } from '@/components/admin/tabs/categories-manager-tab'
import { BlogManagerTab } from '@/components/admin/tabs/blog-manager-tab'
import { OrdersTab } from '@/components/admin/tabs/orders-tab'
import { InquiriesTab } from '@/components/admin/tabs/inquiries-tab'
import { CustomersTab } from '@/components/admin/tabs/customers-tab'
import { SettingsTab } from '@/components/admin/tabs/settings-tab'

export default function AdminPage() {
  const { activeTab } = useAdmin()

  switch (activeTab) {
    case 'dashboard':
      return <DashboardTab />
    case 'pages':
      return <PagesEditorTab />
    case 'cars':
      return <CarsManagerTab />
    case 'products':
      return <ProductsManagerTab />
    case 'categories':
      return <CategoriesManagerTab />
    case 'blog':
      return <BlogManagerTab />
    case 'orders':
      return <OrdersTab />
    case 'inquiries':
      return <InquiriesTab />
    case 'customers':
      return <CustomersTab />
    case 'settings':
      return <SettingsTab />
    default:
      return <DashboardTab />
  }
}
