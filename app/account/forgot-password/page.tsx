import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'
import { ForgotPasswordForm } from '@/components/account/forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset your password | ALI FLEET',
  description: 'Request a secure password recovery link for your ALI FLEET account.',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return <AuthShell screen="forgot" configured><ForgotPasswordForm /></AuthShell>
}
