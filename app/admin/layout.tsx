import React from 'react'
import type { Metadata } from 'next'
import { AdminProvider } from '@/lib/admin/admin-context'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminToastContainer } from '@/components/admin/admin-toast'
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard'

export const metadata: Metadata = {
  title: 'ALI FLEET — لوحة التحكم الإدارية',
  description: 'Executive Control Panel for ALI FLEET luxury vehicle fleet and store content.',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProvider>
      <AdminAuthGuard>
        <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
          <AdminHeader />
          <div className="flex flex-1 overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
          <AdminToastContainer />
        </div>
      </AdminAuthGuard>
    </AdminProvider>
  )
}
