import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Film, RefreshCw } from 'lucide-react'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { StudioModalShell } from '@/components/StudioModalShell'
import { SmmFindClipsPanel } from '@/components/smm/SmmFindClipsPanel'
import { SmmPublishAttestModal } from '@/components/smm/SmmPublishAttestModal'
import { SmmSmmObserverWorkspace } from '@/components/smm/SmmSmmObserverWorkspace'
import { SmmTitlesHandoffPanel } from '@/components/smm/SmmTitlesHandoffPanel'
import { SmmVideoQaWorkspace } from '@/components/smm/SmmVideoQaWorkspace'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  formatSyncedAt,
  getManifestForBatch,
  reloadDriveManifestForBatch,
} from '@/lib/driveMedia'
import {
  batchNeedsSmmFindClips,
  batchReadyForScheduling,
  batchReadyForSmmClose,
  getSmmBatchDetailMode,
  smmStageHint,
  toSmmVideoCard,
  videoNeedsSmmQa,
} from '@/lib/smmBoard'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder | null
  clientName: string
  allVideos: AdminVideoTicket[]
  open: boolean
  onClose: () => void
}

function driveHeaderMeta(
  manifest: BatchDriveManifest | undefined,
  syncMsg: string | null,
): ReactNode {
  return (
    <>
      {manifest ? (
        <>
          Last synced {formatSyncedAt(manifest.syncedAt)}
          {manifest.unmapped.length > 0 && (
            <span className="text-destructive">
              {' '}
              · {manifest.unmapped.length} unmapped file(s)
            </span>
          )}
        </>
      ) : (
        'No Drive manifest loaded.'
      )}
      {syncMsg ? (
        <span className="text-destructive">
          {' '}
          · {syncMsg}
        </span>
      ) : null}
    </>
  )
}

export function SmmBatchDetailModal({
  batch,
  clientName,
  allVideos,
  open,
  onClose,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  const [manifestOverride, setManifestOverride] = useState<
    BatchDriveManifest | undefined
  >(undefined)
  const [driveSyncing, setDriveSyncing] = useState(false)
  const [driveSyncMessage, setDriveSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    setManifestOverride(undefined)
    setDriveSyncMessage(null)
    setDriveSyncing(false)
  }, [batch?.id])

  const batchTickets = useMemo(() => {
    if (!batch) return []
    return allVideos
      .filter((v) => v.batchId === batch.id)
      .sort(
        (a, b) =>
          (a.deliverableIndex ?? 999) - (b.deliverableIndex ?? 999),
      )
  }, [batch, allVideos])

  const qaInitial = useMemo((): ReturnType<typeof toSmmVideoCard> | null => {
    if (batchTickets.length === 0) return null
    const cards = batchTickets.map(toSmmVideoCard)
    return cards.find((c) => videoNeedsSmmQa(c)) ?? cards[0] ?? null
  }, [batchTickets])

  const [publishOpen, setPublishOpen] = useState(false)

  const handleSyncDrive = useCallback(async () => {
    if (!batch) return
    setDriveSyncing(true)
    setDriveSyncMessage(null)
    try {
      const next = await reloadDriveManifestForBatch(batch.id)
      if (next) {
        setManifestOverride(next)
      } else {
        setDriveSyncMessage('No manifest for this batch yet.')
      }
    } catch {
      setDriveSyncMessage('Could not reload manifest — try a full page refresh.')
    } finally {
      setDriveSyncing(false)
    }
  }, [batch])

  if (!open || !batch) return null

  const mode = getSmmBatchDetailMode(batch.id)
  const showFindClips = batchNeedsSmmFindClips(batch)

  const showQaClientStyle =
    mode === 'smm_qa_client_style' &&
    qaInitial != null &&
    batchTickets.some((v) => videoNeedsSmmQa(v))

  const hideOuterDeliverableList =
    showQaClientStyle ||
    mode === 'titles_handoff' ||
    mode === 'observe_client_final' ||
    mode === 'observe_thumbnails'

  const showTitles = mode === 'titles_handoff'

  const showObserve =
    mode === 'observe_client_final' ||
    mode === 'observe_thumbnails' ||
    mode === 'observe_editor_cutting'

  const showPublish =
    (batchReadyForScheduling(batch, allVideos) ||
      batchReadyForSmmClose(batch, allVideos)) &&
    !showTitles &&
    !showFindClips &&
    !showQaClientStyle

  const needsDriveHeader =
    showQaClientStyle ||
    showTitles ||
    showObserve

  const manifest = manifestOverride ?? getManifestForBatch(batch.id)

  const primaryDriveUrl =
    mode === 'observe_editor_cutting'
      ? batch.clipsFolderUrl?.trim() ?? ''
      : batch.editorDeliverablesDriveUrl?.trim() ?? ''

  const goToDriveLabel =
    mode === 'observe_editor_cutting' ? 'Go to clips folder' : 'Go to Drive'

  const shellFooter =
    showTitles ? (
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setPublishOpen(true)
          }}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ background: primary }}
        >
          Mark this batch complete
        </button>
      </div>
    ) : undefined

  const headerAside = needsDriveHeader ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => {
          void handleSyncDrive()
        }}
        disabled={driveSyncing}
        className="border-border bg-muted/30 hover:border-primary/35 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`size-3.5 ${driveSyncing ? 'animate-spin' : ''}`} aria-hidden />
        Sync from Drive
      </button>
      {primaryDriveUrl ? (
        <a
          href={primaryDriveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors"
        >
          {goToDriveLabel}
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      ) : null}
    </div>
  ) : undefined

  const shellHeaderMeta = needsDriveHeader
    ? driveHeaderMeta(manifest, driveSyncMessage)
    : undefined

  const bodyScrollClass =
    showTitles || showQaClientStyle || showObserve
      ? 'min-h-0 flex-1 overflow-y-auto'
      : 'min-h-0 flex-1 flex-col'

  return (
    <>
      <StudioModalShell
        title={batch.title}
        subtitle={`${clientName} · Batch ${batch.batchNumber}`}
        titleId="smm-batch-detail-title"
        onClose={onClose}
        footer={shellFooter}
        headerAside={headerAside}
        headerMeta={shellHeaderMeta}
      >
        <div className={`flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-6 ${bodyScrollClass}`}>
          <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${showTitles || showQaClientStyle || showObserve ? '' : 'min-h-[min(60vh,520px)]'}`}>
            {showFindClips ? (
              <SmmFindClipsPanel
                batch={batch}
                clientName={clientName}
                onSubmitted={onClose}
              />
            ) : showQaClientStyle && qaInitial ? (
              <SmmVideoQaWorkspace
                batch={batch}
                clientName={clientName}
                batchTickets={batchTickets}
                initialCard={qaInitial}
                manifest={manifest}
                onClose={onClose}
                layoutClientStyle
              />
            ) : showTitles ? (
              <SmmTitlesHandoffPanel
                batch={batch}
                batchTickets={batchTickets}
                manifest={manifest}
              />
            ) : showObserve ? (
              <SmmSmmObserverWorkspace
                batch={batch}
                batchTickets={batchTickets}
                clientName={clientName}
                mode={mode}
                manifest={manifest}
              />
            ) : showPublish ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  When you have scheduled every video in this batch on the client&apos;s social
                  platforms, confirm below. Studio does not collect publish links — this step is
                  your attestation only.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPublishOpen(true)
                  }}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                  style={{ background: primary }}
                >
                  Mark batch completed
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  This batch is waiting on the client or editor. Open Drive folders from your admin
                  handoff; deliverables are listed on the right.
                </p>
                {batch.clipsFolderUrl ? (
                  <a
                    href={batch.clipsFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    Clips folder
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
                {batch.editorDeliverablesDriveUrl ? (
                  <a
                    href={batch.editorDeliverablesDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    Editor deliverables
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {!hideOuterDeliverableList ? (
            <aside className="border-border bg-muted/15 flex w-full max-w-full shrink-0 flex-col rounded-xl border md:w-56">
              <p className="text-muted-foreground border-border border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wide">
                Videos in this batch
              </p>
              <ul className="max-h-[min(50vh,400px)] space-y-1 overflow-y-auto p-2 md:max-h-none">
                {batchTickets.length === 0 ? (
                  <li className="text-muted-foreground px-1 py-2 text-xs">
                    No deliverable rows yet (e.g. clip gate or intake still open).
                  </li>
                ) : (
                  batchTickets.map((t) => (
                    <li
                      key={t.id}
                      className="bg-background/80 rounded-lg border border-transparent px-2 py-2"
                    >
                      <div className="flex items-start gap-2">
                        <Film className="text-muted-foreground mt-0.5 size-3.5 shrink-0" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-foreground text-xs font-medium leading-snug">
                            {t.deliverableIndex != null
                              ? `Video ${t.deliverableIndex}`
                              : 'Batch gate'}
                            {t.title ? ` · ${t.title}` : ''}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-[10px]">
                            {smmStageHint(t.stageLabel)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </aside>
          ) : null}
        </div>
      </StudioModalShell>

      <SmmPublishAttestModal
        batch={batch}
        clientName={clientName}
        attestPurpose={showTitles ? 'titles_prep' : 'schedule_publish'}
        open={publishOpen}
        onClose={() => {
          setPublishOpen(false)
        }}
        onConfirm={() => {
          setPublishOpen(false)
          onClose()
        }}
      />
    </>
  )
}
