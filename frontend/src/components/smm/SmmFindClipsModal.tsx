import { StudioModalShell } from '@/components/StudioModalShell'
import { SmmFindClipsPanel } from '@/components/smm/SmmFindClipsPanel'
import type { AdminBatchFolder } from '@mockData/index'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  open: boolean
  onClose: () => void
}

export function SmmFindClipsModal({ batch, clientName, open, onClose }: Props) {
  if (!open) return null

  return (
    <StudioModalShell
      title="Find clips"
      subtitle={`${clientName} · ${batch.title}`}
      titleId="smm-find-clips-title"
      onClose={onClose}
    >
      <SmmFindClipsPanel batch={batch} clientName={clientName} onSubmitted={onClose} />
    </StudioModalShell>
  )
}
