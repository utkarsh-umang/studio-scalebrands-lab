import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { ClipsReviewPanel } from '@/components/drive/ClipsReviewPanel'
import { StudioModalShell } from '@/components/StudioModalShell'
import { DriveSyncButton } from '@/components/path-b/DriveSyncButton'
import { DriveSyncMeta } from '@/components/path-b/DriveSyncMeta'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'

export type NumberedClipsModalMode = 'client' | 'editor' | 'view'

type Props = {
  open: boolean
  onClose: () => void
  batchId: string
  batchTitle: string
  clipsFolderUrl: string
  mode?: NumberedClipsModalMode
  /** Re-open / batch switch */
  resetKey?: string | number
  onApproveAll?: () => void
  onRejectClips?: (note: string) => void
  /** Editor — submit deliverables Drive root (videos/ + thumbnails/) */
  deliverablesDriveUrl?: string
  onDeliverablesDriveUrlChange?: (url: string) => void
  onSubmitDeliverables?: () => void
  submitDeliverablesDisabled?: boolean
}

export function NumberedClipsModal({
  open,
  onClose,
  batchId,
  batchTitle,
  clipsFolderUrl,
  mode = 'view',
  resetKey,
  onApproveAll,
  onRejectClips,
  deliverablesDriveUrl = '',
  onDeliverablesDriveUrlChange,
  onSubmitDeliverables,
  submitDeliverablesDisabled = false,
}: Props) {
  const { manifest, syncing, error, sync } = useDriveManifestSync(batchId, resetKey)
  const [driveDraft, setDriveDraft] = useState(deliverablesDriveUrl)

  if (!open) return null

  const showClientFooter = mode === 'client' && onApproveAll && onRejectClips
  const readOnly = mode !== 'client' || !showClientFooter
  const showEditorSubmit = mode === 'editor' && Boolean(onSubmitDeliverables)
  const controlledDriveUrl = onDeliverablesDriveUrlChange != null

  const headerAside = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <DriveSyncButton
        onSync={() => {
          void sync()
        }}
        syncing={syncing}
      />
      {clipsFolderUrl.trim() ? (
        <a
          href={clipsFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors"
        >
          Open clips folder
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      ) : null}
    </div>
  )

  const editorFooter = showEditorSubmit ? (
    <section className="space-y-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        Paste the shared Drive folder that contains <strong className="text-foreground">videos/</strong>{' '}
        and <strong className="text-foreground">thumbnails/</strong> with numbered files{' '}
        <span className="tabular-nums">1…n</span>. Studio will split this batch into one card per clip.
      </p>
      <label
        htmlFor="numbered-clips-deliverables-url"
        className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wide"
      >
        Deliverables folder URL
      </label>
      <input
        id="numbered-clips-deliverables-url"
        type="url"
        value={controlledDriveUrl ? deliverablesDriveUrl : driveDraft}
        onChange={(e) => {
          const v = e.target.value
          if (controlledDriveUrl) onDeliverablesDriveUrlChange?.(v)
          else setDriveDraft(v)
        }}
        placeholder="https://drive.google.com/drive/folders/…"
        className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      <button
        type="button"
        onClick={onSubmitDeliverables}
        disabled={
          submitDeliverablesDisabled ||
          !(controlledDriveUrl ? deliverablesDriveUrl : driveDraft).trim()
        }
        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 sm:w-auto"
      >
        Submit videos for this batch
      </button>
    </section>
  ) : null

  return (
    <StudioModalShell
      title={`${batchTitle} · Clips`}
      subtitle="Numbered clips from Drive"
      titleId="numbered-clips-modal-title"
      onClose={onClose}
      headerAside={headerAside}
      headerMeta={<DriveSyncMeta manifest={manifest} errorMessage={error} />}
      footer={editorFooter ?? undefined}
    >
      {error && !manifest ? (
        <p className="text-destructive mb-3 text-xs leading-relaxed">{error}</p>
      ) : null}

      <div className="border-border flex min-h-[min(52vh,480px)] flex-col overflow-hidden rounded-xl border md:min-h-[480px]">
        <ClipsReviewPanel
          batchId={batchId}
          manifest={manifest}
          clipsFolderUrl={clipsFolderUrl}
          readOnly={readOnly && !showClientFooter}
          sidebarPosition="left"
          onApprove={showClientFooter ? onApproveAll : undefined}
          onReject={showClientFooter ? onRejectClips : undefined}
        />
      </div>
    </StudioModalShell>
  )
}
