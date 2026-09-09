import 'server-only'

export async function setSessionCookies(_tokens: {
  authToken: string
  refreshToken: string
}): Promise<void> {}

export async function clearSessionCookies(): Promise<void> {}

export async function hasSession(): Promise<boolean> {
  return false
}

export async function getAuthToken(): Promise<string | null> {
  return null
}
