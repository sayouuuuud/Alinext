import type { Metadata } from 'next'
import { AdminUserDetail } from '@/components/admin/user-detail'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Customer profile | ALI FLEET Admin', robots: { index: false, follow: false } }

type PageProps = { params: Promise<{ id: string }> }

export default async function AdminUserPage({ params }: PageProps) {
  const { id } = await params
  return <AdminUserDetail userId={id} />
}
