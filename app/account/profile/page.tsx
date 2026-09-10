import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadAccount } from '@/lib/auth/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { ProfileView } from '@/components/account/profile-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Personal details | ALI FLEET',
  description: 'Update the name, email address and password on your ALI FLEET account.',
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  const data = await loadAccount(0)
  if (data.state === 'error') {
    if (data.code === 'not_logged_in') redirect('/account/login?redirectTo=/account/profile')
    return <AccountGuard code={data.code} />
  }
  return <ProfileView customer={data.customer} />
}
