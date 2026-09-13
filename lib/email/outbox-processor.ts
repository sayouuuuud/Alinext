import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { getSmtpConfig, sendSmtpMail } from '@/lib/email/smtp'
import {
  buildOrderStatusEmail,
  normalizeEvent,
  normalizeLocale,
  publicOrderLinks,
} from '@/lib/email/order-status-email'

export type OutboxBatchResult = {
  skipped: boolean
  claimed: number
  sent: number
  failed: number
}

type ClaimedRow = {
  outbox_id: string
  notification_id: string
  recipient: string
  event_type: string
  payload: Record<string, unknown>
  preferred_locale: string
  order_id: string
  order_number: string
}

function payloadText(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value : null
}

/**
 * Claims a batch of pending outbox rows (service_role only) and sends them
 * via Gmail SMTP. Safe no-op when SMTP is not configured: rows stay pending
 * and nothing is claimed, so enabling SMTP later just works.
 */
export async function processNotificationOutboxBatch(limit = 10): Promise<OutboxBatchResult> {
  const smtp = getSmtpConfig()
  if (!smtp) return { skipped: true, claimed: 0, sent: 0, failed: 0 }

  const safeLimit = Math.max(1, Math.min(limit, 25))
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('claim_notification_email_batch', { p_limit: safeLimit })
  if (error || !data) return { skipped: false, claimed: 0, sent: 0, failed: 0 }

  const rows = (Array.isArray(data) ? data : []) as ClaimedRow[]
  let sent = 0
  let failed = 0

  for (const row of rows) {
    try {
      const eventType = normalizeEvent(row.event_type)
      if (!eventType) {
        await admin.rpc('fail_notification_email', { p_outbox_id: row.outbox_id, p_error_code: 'unknown_event' })
        failed += 1
        continue
      }
      const locale = normalizeLocale(row.preferred_locale)
      const links = publicOrderLinks(row.order_id)
      const mail = buildOrderStatusEmail({
        eventType,
        locale,
        orderNumber: row.order_number,
        status: payloadText(row.payload, 'status') || row.event_type,
        carrier: payloadText(row.payload, 'carrier'),
        trackingNumber: payloadText(row.payload, 'trackingNumber'),
        estimatedDelivery: payloadText(row.payload, 'estimatedDelivery'),
        note: payloadText(row.payload, 'note'),
        orderHref: links.orderHref,
        invoiceHref: links.invoiceHref,
      })
      // Deterministic Message-ID per notification: safe retries never duplicate.
      const messageId = `<${row.notification_id}@alifleet.local>`
      const result = await sendSmtpMail({
        to: row.recipient,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        messageId,
      })
      if (result.skipped) {
        await admin.rpc('fail_notification_email', { p_outbox_id: row.outbox_id, p_error_code: 'smtp_not_configured' })
        failed += 1
        continue
      }
      await admin.rpc('complete_notification_email', {
        p_outbox_id: row.outbox_id,
        p_provider_message_id: result.messageId || messageId,
      })
      sent += 1
    } catch (sendError) {
      const code = sendError instanceof Error ? sendError.message.slice(0, 100) : 'smtp_error'
      await admin.rpc('fail_notification_email', { p_outbox_id: row.outbox_id, p_error_code: code })
      failed += 1
    }
  }

  return { skipped: false, claimed: rows.length, sent, failed }
}
