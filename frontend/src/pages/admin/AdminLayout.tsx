import { CalendarClock, LayoutDashboard, Shield, Users } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
const NAV = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/admin/employees', label: 'Team', Icon: Users, end: false },
  { to: '/admin/deadlines', label: 'Deadlines', Icon: CalendarClock, end: false },
] as const

export function AdminLayout() {
  return (
    <PortalShell
      roleLabel="Admin workspace"
      fallbackName="Admin"
      ProfileIcon={Shield}
      nav={NAV}
      showNotifications={false}
    />
  )
}
