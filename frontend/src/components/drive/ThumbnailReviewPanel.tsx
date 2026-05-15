import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { DriveFolderReviewShell } from '@/components/drive/DriveFolderReviewShell'
import { DriveMediaPicker } from '@/components/drive/DriveMediaPicker'
import { DriveThumbnailPreview } from '@/components/drive/DriveThumbnailPreview'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import {
  deliverableIndexForTicket,
  getManifestForBatch,
  getMediaEntry,
} from '@/lib/driveMedia'
import { flagsToQaComments } from '@/lib/qaComments'
import type { AdminVideoTicket } from '@mockData/index'

type Props = {
  batchId: string
  deliverablesFolderUrl: string
  ticket: AdminVideoTicket
  onApprove: () => void
  onReject: (note: string) => void
}

export function ThumbnailReviewPanel({
  batchId,
  deliverablesFolderUrl,
  ticket,
  onApprove,
  onReject,
}: Props) {
  const index = deliverableIndexForTicket(ticket)
  const manifest = getManifestForBatch(batchId)
  const thumbs = manifest?.thumbnails ?? []
  const [selectedIndex, setSelectedIndex] = useState(index)
  const selected =
    getMediaEntry(batchId, 'thumbnails', selectedIndex) ??
    thumbs.find((t) => t.index === selectedIndex)

  const [rejectNote, setRejectNote] = useState('')
  const history = flagsToQaComments(ticket, 'thumbnail')

  return (
    <DriveFolderReviewShell
      batchId={batchId}
      folderUrl={deliverablesFolderUrl}
      folderLabel="Open deliverables folder on Drive"
    >
      <p className="text-muted-foreground mb-4 text-center text-sm leading-relaxed">
        Review the thumbnail image for this short. Approve when it matches your brand, or
        reject with feedback for the editor.
      </p>

      <DriveMediaPicker
        entries={thumbs}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        label="Thumb"
      />

      {selected ? (
        <div className="mx-auto w-full max-w-xl">
          <DriveThumbnailPreview
            driveFileId={selected.driveFileId}
            fileName={selected.name}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          No thumbnail #{selectedIndex} in manifest.
        </p>
      )}

      <QaCommentThread comments={history} heading="Earlier feedback" />

      <div className="border-border mt-6 space-y-3 border-t pt-4">
        <label className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wide">
          Reason if rejecting
        </label>
        <textarea
          value={rejectNote}
          onChange={(e) => {
            setRejectNote(e.target.value)
          }}
          rows={3}
          placeholder="What should change on the thumbnail?"
          className="border-border bg-background w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--success)] px-4 py-2.5 text-sm font-semibold text-white sm:flex-none"
          >
            <Check className="size-4" aria-hidden />
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              if (!rejectNote.trim()) return
              onReject(rejectNote.trim())
            }}
            disabled={!rejectNote.trim()}
            className="border-border inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 sm:flex-none"
          >
            <X className="size-4" aria-hidden />
            Reject
          </button>
        </div>
      </div>
    </DriveFolderReviewShell>
  )
}
