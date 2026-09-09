import 'server-only'

import type { AccountData, Viewer } from './types'

export async function loadAccount(_orderLimit = 20): Promise<AccountData> {
  return { state: 'error', code: 'not_configured' }
}

export async function loadViewer(): Promise<Viewer | null> {
  return null
}
