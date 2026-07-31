import { CheckCircle2, Clapperboard, Scissors } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'

const NAV = [
  { to: '/editor/board', label: 'Production', Icon: Clapperboard, end: true },
  { to: '/editor/completed', label: 'Completed', Icon: CheckCircle2 },
] as const

export function EditorLayout() {
  return (
    <PortalShell
      roleLabel="Editor workspace"
      fallbackName="Editor"
      ProfileIcon={Scissors}
      nav={NAV}
    />
  )
}
