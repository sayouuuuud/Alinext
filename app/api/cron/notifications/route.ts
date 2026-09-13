import { NextResponse } from 'next/server'

import { processNotificationOutboxBatch } from '@/lib/email/outbox-processor'

export const dynamic = 'force-dynamic'

/**
 * Cron/ops endpoint that drains the notification email outbox via Gmail SMTP.
 * Protected: if CRON_SECRET is set (production), callers must send
 * `Authorization: Bearer <secret>`. If CRON_SECRET is not set, the endpoint
 * is disabled (503) so it can never be public by accident.
 */
export async function GET(request: Request) {
  const secret = (process.env.CRON_SECRET || '').trim()
  if (!secret) {
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  }
  const header = request.headers.get('authorization') || ''
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || '10'), 25))
  try {
    const result = await processNotificationOutboxBatch(limit)
    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 })
  }
}
