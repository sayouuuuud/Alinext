import 'server-only'

import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { headers } from 'next/headers'

import { wpRevalidateSecret } from './config'

export type WordPressSecurityHeaders = Partial<
  Record<
    | 'x-alifleet-client-ip'
    | 'x-alifleet-client-ip-timestamp'
    | 'x-alifleet-client-ip-signature',
    string
  >
>

function validClientAddress(value: string | null) {
  if (!value) return ''
  const address = value.split(',', 1)[0]?.trim() ?? ''
  return isIP(address) ? address : ''
}

export async function wordpressSecurityHeaders(): Promise<WordPressSecurityHeaders> {
  const requestHeaders = await headers()
  const address =
    validClientAddress(requestHeaders.get('x-forwarded-for')) ||
    validClientAddress(requestHeaders.get('x-real-ip'))
  const secret = wpRevalidateSecret()

  if (!address || !secret) return {}

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = createHmac('sha256', secret)
    .update(`${address}|${timestamp}`)
    .digest('hex')

  return {
    'x-alifleet-client-ip': address,
    'x-alifleet-client-ip-timestamp': timestamp,
    'x-alifleet-client-ip-signature': signature,
  }
}
