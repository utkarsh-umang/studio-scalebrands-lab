import type { AuthUser } from '@/auth'
import type { AdminBatchFolder, AdminClientProfile } from '@/types/pathB'

/**
 * Prototype RBAC: SMM and Editor may only open batches for clients assigned to them.
 * Admins and clients use separate rules (client sees own batches via client portal).
 */
export function canEmployeeAccessClientBatch(
  user: AuthUser,
  client: Pick<
    AdminClientProfile,
    'assignedSmmId' | 'assignedEditorId'
  >,
): boolean {
  if (user.role === 'admin') return true
  if (user.role !== 'employee' || !user.employeeKind) return false
  if (user.employeeKind === 'smm') return user.id === client.assignedSmmId
  if (user.employeeKind === 'editor') return user.id === client.assignedEditorId
  return false
}

export function canEmployeeAccessBatchFolder(
  user: AuthUser,
  client: Pick<
    AdminClientProfile,
    'assignedSmmId' | 'assignedEditorId'
  >,
  _batch: Pick<AdminBatchFolder, 'id' | 'clientId'>,
): boolean {
  return canEmployeeAccessClientBatch(user, client)
}
