import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'
import { LoginForm } from '@/components/account/login-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign in | ALI FLEET',
  description: 'Securely sign in to your ALI FLEET account.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <AuthShell screen="login" configured>
      <Suspense fallback={null}><LoginForm /></Suspense>
    </AuthShell>
  )
}
