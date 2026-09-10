import type { Metadata } from 'next'
import { UpdatePasswordForm } from '@/components/account/update-password-form'
import { AccountGuard } from '@/components/account/account-guard'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Update password | ALI FLEET', robots: { index: false, follow: false } }

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return <AccountGuard code="not_logged_in" />
  return <div className="mx-auto max-w-xl"><UpdatePasswordForm /></div>
}
