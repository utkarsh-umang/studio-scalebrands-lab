import { useState, type ReactNode } from 'react'
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
  onSubmitDeliverables?: (payload: {
    deliverableCount: number
    deliverables: { index: number; title: string }[]
  }) => void
  submitDeliverablesDisabled?: boolean
  /** Shown above the clips panel (client in-progress states). */
  statusBanner?: ReactNode
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
  statusBanner,
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
        onClick={() => {
          if (!onSubmitDeliverables) return
          const clipCount = manifest?.clips.length ?? 0
          const videoCount = manifest?.videos.length ?? 0
          const deliverableCount = Math.max(clipCount, videoCount, 1)
          const deliverables = Array.from({ length: deliverableCount }, (_, i) => {
            const index = i + 1
            const clip = manifest?.clips.find((c) => c.index === index)
            const video = manifest?.videos.find((v) => v.index === index)
            const title = (clip?.name ?? video?.name ?? '').trim()
            return title ? { index, title } : null
          }).filter((row): row is { index: number; title: string } => row != null)
          onSubmitDeliverables({ deliverableCount, deliverables })
        }}
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
      bodyScroll={false}
      footer={editorFooter ?? undefined}
    >
      {error && !manifest ? (
        <p className="text-destructive mb-3 shrink-0 text-xs leading-relaxed">{error}</p>
      ) : null}

      {statusBanner ? (
        <div className="border-primary/25 bg-primary/5 text-foreground mb-3 shrink-0 rounded-xl border px-4 py-3 text-sm leading-relaxed">
          {statusBanner}
        </div>
      ) : null}

      <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border md:min-h-[min(52vh,480px)]">
        <ClipsReviewPanel
          batchId={batchId}
          manifest={manifest}
          clipsFolderUrl={clipsFolderUrl}
          className="h-full min-h-[min(48vh,420px)] md:min-h-[min(52vh,480px)]"
          readOnly={readOnly}
          sidebarPosition="left"
          onApprove={showClientFooter ? onApproveAll : undefined}
          onReject={showClientFooter ? onRejectClips : undefined}
        />
      </div>
    </StudioModalShell>
  )
}
