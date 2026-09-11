import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { InvoiceView } from '@/components/account/invoice-view'
import { loadUserOrder } from '@/lib/orders/queries'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Invoice | ALI FLEET', robots: { index: false, follow: false } }

type PageProps = { params: Promise<{ id: string }> }

export default async function InvoicePage({ params }: PageProps) {
  const { id } = await params
  const result = await loadUserOrder(id)
  if (result.state === 'signed_out') redirect(`/account/login?redirectTo=/account/orders/${encodeURIComponent(id)}/invoice`)
  if (result.state === 'not_found') notFound()
  if (result.state !== 'ready' || !result.order) return <div>Invoice unavailable.</div>
  return <InvoiceView order={result.order} />
}
