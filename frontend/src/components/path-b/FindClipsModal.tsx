import { StudioModalShell } from '@/components/StudioModalShell'
import {
  FindClipsPanel,
  type FindClipsPanelRole,
} from '@/components/path-b/FindClipsPanel'
import type { AdminBatchFolder } from '@/types/pathB'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  role?: FindClipsPanelRole
  open: boolean
  onClose: () => void
}

export function FindClipsModal({
  batch,
  clientName,
  role = 'smm',
  open,
  onClose,
}: Props) {
  if (!open) return null

  return (
    <StudioModalShell
      title="Find clips"
      subtitle={`${clientName} · ${batch.title}`}
      titleId={`find-clips-title-${role}`}
      onClose={onClose}
    >
      <FindClipsPanel
        batch={batch}
        clientName={clientName}
        role={role}
        onSubmitted={onClose}
      />
    </StudioModalShell>
  )
}
