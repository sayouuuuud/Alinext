import type { Database } from '@/lib/supabase/database.types'

export type AdminRole = Database['public']['Enums']['admin_role']
export type AdminPermission =
  | 'dashboard.read'
  | 'content.write'
  | 'content.delete'
  | 'operations.write'
  | 'customers.delete'
  | 'settings.write'
  | 'media.write'

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [
    'dashboard.read',
    'content.write',
    'content.delete',
    'operations.write',
    'customers.delete',
    'settings.write',
    'media.write',
  ],
  content_editor: ['dashboard.read', 'content.write', 'content.delete', 'media.write'],
  operations: ['dashboard.read', 'operations.write'],
}

export function permissionsForRole(role: AdminRole): AdminPermission[] {
  return [...ROLE_PERMISSIONS[role]]
}

export function roleHasPermission(role: AdminRole, permission: AdminPermission) {
  return ROLE_PERMISSIONS[role].includes(permission)
}
