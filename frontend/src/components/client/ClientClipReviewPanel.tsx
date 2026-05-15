import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { DriveFolderReviewShell } from '@/components/drive/DriveFolderReviewShell'
import { DriveMediaPicker } from '@/components/drive/DriveMediaPicker'
import { DriveVideoPreview } from '@/components/drive/DriveVideoPreview'
import { getManifestForBatch } from '@/lib/driveMedia'

type Props = {
  batchId: string
  clipsFolderUrl: string
  onApprove: () => void
  onReject: (note: string) => void
}

export function ClientClipReviewPanel({
  batchId,
  clipsFolderUrl,
  onApprove,
  onReject,
}: Props) {
  const manifest = getManifestForBatch(batchId)
  const clips = manifest?.clips ?? []
  const [selectedIndex, setSelectedIndex] = useState(clips[0]?.index ?? 1)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const selected = useMemo(
    () => clips.find((c) => c.index === selectedIndex),
    [clips, selectedIndex],
  )

  return (
    <DriveFolderReviewShell
      batchId={batchId}
      folderUrl={clipsFolderUrl}
      folderLabel="Open clips folder on Drive"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="text-muted-foreground mb-4 text-center text-sm leading-relaxed">
          Review each numbered clip below. Approve the full set when ready, or reject with
          which clip number(s) need changes.
        </p>

        <DriveMediaPicker
          entries={clips}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          label="Clip"
        />

        {selected ? (
          <div className="mx-auto w-full max-w-3xl flex-1">
            <p className="text-muted-foreground mb-2 text-center text-xs font-medium">
              {selected.name}
            </p>
            <DriveVideoPreview driveFileId={selected.driveFileId} fileName={selected.name} />
            <p className="text-muted-foreground mt-3 text-center text-xs">
              Timestamped feedback is available on edited videos later. For clips, describe
              issues in the reject note (e.g. &quot;Clip 3 — re-cut from 1:20&quot;).
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            No clips in manifest. Run <code className="font-mono">npm run drive:sync-manifests</code>.
          </p>
        )}

        {showRejectForm && (
          <div className="mx-auto mt-6 w-full max-w-lg space-y-2 text-left">
            <label
              htmlFor="clip-reject-note"
              className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wide"
            >
              Which clip should change, and why?
            </label>
            <textarea
              id="clip-reject-note"
              value={rejectNote}
              onChange={(e) => {
                setRejectNote(e.target.value)
              }}
              rows={4}
              autoFocus
              placeholder="e.g. Clip 2 — drop this one. Clip 3 — re-cut from 1:20, hook is too slow."
              className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
        )}

        <div className="mt-auto flex justify-center gap-3 pt-8">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl bg-[var(--success)] px-6 py-2.5 text-sm font-semibold text-white"
          >
            <Check className="size-4" aria-hidden />
            Approve all clips
          </button>
          {!showRejectForm ? (
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(true)
              }}
              className="border-border text-destructive hover:bg-destructive/5 inline-flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl border px-6 py-2.5 text-sm font-semibold"
            >
              <X className="size-4" aria-hidden />
              Reject
            </button>
          ) : (
            <button
              type="button"
              disabled={!rejectNote.trim()}
              onClick={() => {
                onReject(rejectNote.trim())
              }}
              className="bg-destructive inline-flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send rejection
            </button>
          )}
        </div>
      </div>
    </DriveFolderReviewShell>
  )
}
