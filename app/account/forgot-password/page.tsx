import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'

export const metadata: Metadata = {
  title: 'Reset your password | ALI FLEET',
  description: 'Password recovery will be available when the account service is connected.',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return <AuthShell screen="forgot" configured={false}>{null}</AuthShell>
}
