import 'server-only'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminPermission } from './session-server'

const resourceSchema = z.enum(['car', 'product', 'category', 'blog', 'customer'])
const idSchema = z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/)
const customerIdSchema = z.string().uuid()

export class AdminResourceError extends Error {
  constructor(public code: string, public status = 422) {
    super(code)
  }
}

export async function deleteAdminResource(rawResource: unknown, rawId: unknown) {
  const resource = resourceSchema.parse(rawResource)
  const id = resource === 'customer' ? customerIdSchema.parse(rawId) : idSchema.parse(rawId)
  const permission = resource === 'customer' ? 'customers.delete' : 'content.delete'
  const session = await requireAdminPermission(permission)
  const admin = createAdminClient()
  let operation: 'archived' | 'deleted' | 'unpublished'

  if (resource === 'car' || resource === 'product') {
    const table = resource === 'car' ? 'cars' : 'products'
    const { data, error } = await admin
      .from(table)
      .update({ archived_at: new Date().toISOString(), published: false })
      .eq('id', id)
      .is('archived_at', null)
      .select('id')
      .maybeSingle()
    if (error) throw new AdminResourceError('delete_failed', 500)
    if (!data) throw new AdminResourceError('resource_not_found', 404)
    operation = 'archived'
  } else if (resource === 'blog') {
    const { data, error } = await admin
      .from('blog_posts')
      .update({ published: false })
      .eq('id', id)
      .select('id')
      .maybeSingle()
    if (error) throw new AdminResourceError('delete_failed', 500)
    if (!data) throw new AdminResourceError('resource_not_found', 404)
    operation = 'unpublished'
  } else if (resource === 'category') {
    const [children, products] = await Promise.all([
      admin.from('categories').select('*', { count: 'exact', head: true }).eq('parent_id', id),
      admin.from('products').select('*', { count: 'exact', head: true }).or(`category_id.eq.${id},subcategory_id.eq.${id}`).is('archived_at', null),
    ])
    if (children.error || products.error) throw new AdminResourceError('dependency_check_failed', 500)
    if (children.count) throw new AdminResourceError('category_has_children', 409)
    if (products.count) throw new AdminResourceError('category_has_products', 409)
    const { data, error } = await admin.from('categories').delete().eq('id', id).select('id').maybeSingle()
    if (error) throw new AdminResourceError('delete_failed', 500)
    if (!data) throw new AdminResourceError('resource_not_found', 404)
    operation = 'deleted'
  } else {
    const [membership, orders] = await Promise.all([
      admin.from('admin_memberships').select('user_id').eq('user_id', id).maybeSingle(),
      admin.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', id),
    ])
    if (membership.error || orders.error) throw new AdminResourceError('dependency_check_failed', 500)
    if (membership.data) throw new AdminResourceError('customer_is_admin', 409)
    if (orders.count) throw new AdminResourceError('customer_has_orders', 409)
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) throw new AdminResourceError('delete_failed', 500)
    operation = 'deleted'
  }

  const { error: auditError } = await admin.from('admin_audit_log').insert({
    actor_id: session.userId,
    action: `${resource}.${operation}`,
    entity_type: resource,
    entity_id: id,
    after_value: { operation, role: session.role },
  })
  if (auditError) console.error('Admin resource audit write failed')

  return { resource, id, operation }
}
