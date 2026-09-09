'use server'

import type { AuthActionState } from './types'

const unavailable: AuthActionState = {
  status: 'error',
  code: 'not_configured',
}

export async function loginAction(
  _previous: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  return unavailable
}

export async function registerAction(
  _previous: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  return unavailable
}

export async function logoutAction(): Promise<void> {}

export async function forgotPasswordAction(
  _previous: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  return unavailable
}

export async function updateProfileAction(
  _previous: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  return unavailable
}

export async function updateAddressesAction(
  _previous: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  return unavailable
}
