import { LayoutDashboard, Layers, User } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'

const NAV = [
  { to: '/client/board', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/client/all', label: 'Our work', Icon: Layers },
] as const

export function ClientLayout() {
  return (
    <PortalShell
      roleLabel="Client workspace"
      fallbackName="Client"
      ProfileIcon={User}
      nav={NAV}
    />
  )
}
