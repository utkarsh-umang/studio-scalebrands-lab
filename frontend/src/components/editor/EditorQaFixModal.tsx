import { ExternalLink } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { DriveOrStreamVideo } from '@/components/drive/DriveOrStreamVideo'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import { StudioModalShell } from '@/components/StudioModalShell'
import {
  deliverableIndexForTicket,
  getMediaEntry,
} from '@/lib/driveMedia'
import { flagsToQaComments } from '@/lib/qaComments'
import type { EditorVideoCard } from '@/lib/editorBoard'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  card: EditorVideoCard
  open: boolean
  onClose: () => void
}

export function EditorQaFixModal({
  batch,
  clientName,
  card,
  open,
  onClose,
}: Props) {
  const { resubmitEditorVideoQa } = useAdminWorkspace()

  if (!open) return null

  const index = deliverableIndexForTicket(card)
  const videoEntry = getMediaEntry(batch.id, 'videos', index)
  const history = flagsToQaComments(card, 'video')
  const backToClient = card.lastRevisionRequestedBy === 'client'

  return (
    <StudioModalShell
      title="Fix QA feedback"
      subtitle={`${clientName} · ${card.title}`}
      titleId="editor-qa-fix-title"
      onClose={onClose}
    >
      <div className="max-w-3xl space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Update video <strong className="text-foreground">#{index}</strong> in your Drive{' '}
          <span className="text-foreground font-medium">Video</span> folder, then resubmit.
          {backToClient
            ? ' This goes back to the client for review (SMM already approved).'
            : ' This goes back to SMM QA.'}
        </p>
        {batch.editorDeliverablesDriveUrl && (
          <a
            href={batch.editorDeliverablesDriveUrl}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-muted/30 text-foreground flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
          >
            Open deliverables folder
            <ExternalLink className="ml-auto size-3.5 shrink-0" aria-hidden />
          </a>
        )}
        {videoEntry && (
          <DriveOrStreamVideo
            driveFileId={videoEntry.driveFileId}
            fileName={videoEntry.name}
            layout="portrait"
          />
        )}
        <QaCommentThread comments={history} />
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              resubmitEditorVideoQa(card.id)
              onClose()
            }}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            {backToClient ? 'Resubmit to client QA' : 'Resubmit to SMM QA'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-border rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </StudioModalShell>
  )
}
