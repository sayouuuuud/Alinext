import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'

export const metadata: Metadata = {
  title: 'Sign in | ALI FLEET',
  description: 'ALI FLEET account access will be available when the account service is connected.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <AuthShell screen="login" configured={false}>{null}</AuthShell>
}
