import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'
import { RegisterForm } from '@/components/account/register-form'

export const metadata: Metadata = {
  title: 'Create an account | ALI FLEET',
  description: 'Create a secure ALI FLEET customer account.',
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return <AuthShell screen="register" configured><RegisterForm /></AuthShell>
}
