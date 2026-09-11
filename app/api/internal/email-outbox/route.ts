import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { processNotificationOutbox } from '@/lib/email/process-outbox'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || !authorization?.startsWith('Bearer ')) return false
  const received = authorization.slice('Bearer '.length)
  const expectedBuffer = Buffer.from(secret)
  const receivedBuffer = Buffer.from(received)
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
}

async function run(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  if (!authorized(request)) return NextResponse.json({ error: 'not_authorized' }, { status: 401 })

  try {
    const result = await processNotificationOutbox(20)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'outbox_processing_failed' }, { status: 500 })
  }
}

export const GET = run
export const POST = run
