import type { AdminBatchFolder } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import { EditorQaFixPanel } from '@/components/editor/EditorQaFixPanel'
import type { EditorVideoCard } from '@/lib/editorBoard'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  card: EditorVideoCard
  open: boolean
  onClose: () => void
}

export function EditorQaFixModal({ batch, clientName, card, open, onClose }: Props) {
  if (!open) return null

  return (
    <StudioModalShell
      title="Fix QA feedback"
      subtitle={`${clientName} · ${card.title}`}
      titleId="editor-qa-fix-title"
      onClose={onClose}
    >
      <EditorQaFixPanel
        batch={batch}
        clientName={clientName}
        ticket={card}
        fallbackVideoSrc={SAMPLE_VIDEO_SRC}
        onResubmitted={onClose}
      />
    </StudioModalShell>
  )
}
