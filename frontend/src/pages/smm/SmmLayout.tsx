import { CheckCircle2, ListChecks, User } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'

const NAV = [
  { to: '/smm/board', label: 'Workflow', Icon: ListChecks, end: true },
  { to: '/smm/completed', label: 'Completed', Icon: CheckCircle2, end: true },
] as const

export function SmmLayout() {
  return (
    <PortalShell
      roleLabel="Social media workspace"
      fallbackName="SMM"
      ProfileIcon={User}
      nav={NAV}
    />
  )
}
