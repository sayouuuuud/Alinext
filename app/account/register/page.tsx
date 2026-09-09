import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'

export const metadata: Metadata = {
  title: 'Create an account | ALI FLEET',
  description: 'ALI FLEET account registration will be available when the account service is connected.',
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return <AuthShell screen="register" configured={false}>{null}</AuthShell>
}
