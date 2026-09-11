import 'server-only'

import { getSmtpConfig, getSmtpTransport } from '@/lib/email/smtp'
import { renderOrderEmail } from '@/lib/email/order-template'
import { createAdminClient } from '@/lib/supabase/server'

type ProcessingResult = {
  configured: boolean
  claimed: number
  sent: number
  failed: number
}

function smtpErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return 'smtp_error'
  const candidate = error as { code?: unknown; responseCode?: unknown }
  const code = typeof candidate.code === 'string' ? candidate.code.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 50) : 'smtp_error'
  const responseCode = typeof candidate.responseCode === 'number' ? String(candidate.responseCode) : ''
  return responseCode ? `${code}_${responseCode}` : code
}

export async function processNotificationOutbox(limit = 10): Promise<ProcessingResult> {
  const config = getSmtpConfig()
  if (!config) return { configured: false, claimed: 0, sent: 0, failed: 0 }

  const cappedLimit = Math.max(1, Math.min(Math.trunc(limit), 50))
  const admin = createAdminClient()
  const claimed = await admin.rpc('claim_notification_email_batch', { p_limit: cappedLimit })
  if (claimed.error) throw new Error('outbox_claim_failed')

  const rows = claimed.data || []
  if (!rows.length) return { configured: true, claimed: 0, sent: 0, failed: 0 }

  const transport = getSmtpTransport(config)
  let sent = 0
  let failed = 0

  for (const row of rows) {
    try {
      const message = renderOrderEmail({
        eventType: row.event_type,
        payload: row.payload,
        locale: row.preferred_locale,
        orderId: row.order_id,
        orderNumber: row.order_number,
      })
      const result = await transport.sendMail({
        from: { name: config.fromName, address: config.fromEmail },
        to: row.recipient,
        subject: message.subject,
        text: message.text,
        html: message.html,
        messageId: `<order-${row.notification_id}@alifleet.com>`,
      })
      const completed = await admin.rpc('complete_notification_email', {
        p_outbox_id: row.outbox_id,
        p_provider_message_id: result.messageId,
      })
      if (completed.error || !completed.data) throw new Error('outbox_complete_failed')
      sent += 1
    } catch (error) {
      failed += 1
      await admin.rpc('fail_notification_email', {
        p_outbox_id: row.outbox_id,
        p_error_code: smtpErrorCode(error),
      })
    }
  }

  return { configured: true, claimed: rows.length, sent, failed }
}
