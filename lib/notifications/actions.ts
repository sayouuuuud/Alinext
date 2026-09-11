'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
}).refine((value) => value.markAll || value.notificationId, { message: 'invalid_request' })

export async function markNotificationsRead(input: unknown) {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid_request' }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false as const, error: 'not_authenticated' }

  const { error } = await supabase.rpc('mark_notifications_read', {
    p_notification_id: parsed.data.markAll ? undefined : parsed.data.notificationId,
  })
  if (error) return { ok: false as const, error: 'update_failed' }

  revalidatePath('/account')
  revalidatePath('/account/notifications')
  return { ok: true as const }
}
