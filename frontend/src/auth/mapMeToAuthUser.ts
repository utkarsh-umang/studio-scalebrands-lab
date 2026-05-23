import type { MeResponse } from '@/client'
import type { AuthUser } from './types'

/** Map API session payload to portal auth user. */
export function mapMeToAuthUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    role: me.role,
    ...(me.employeeKind !== undefined && me.employeeKind !== null
      ? { employeeKind: me.employeeKind }
      : {}),
    ...(me.clientProfileId !== undefined && me.clientProfileId !== null
      ? { clientProfileId: me.clientProfileId }
      : {}),
  }
}
