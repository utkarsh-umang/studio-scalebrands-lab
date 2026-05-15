import { useMemo, useState } from 'react'
import { SAMPLE_VIDEO_SRC } from '@mockData/index'
import type { AdminBatchFolder, AdminVideoTicket } from '@mockData/index'
import { DriveOrStreamVideo } from '@/components/drive/DriveOrStreamVideo'
import { QaCommentThread } from '@/components/drive/QaCommentThread'
import { videoNeedsClientFinalReview } from '@/lib/clientBoard'
import type { DeliverableSidebarRow } from '@/lib/deliverableSidebar'
import { buildDeliverableSidebarRows } from '@/lib/deliverableSidebar'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import {
  deliverableIndexForTicket,
  driveThumbnailUrl,
  getMediaEntry,
} from '@/lib/driveMedia'
import { flagsToQaComments, generalFromComments, markersFromComments } from '@/lib/qaComments'
import {
  qaPortraitChromeClass,
  qaPortraitPlayerBoxClass,
  qaPortraitVideoInnerClass,
} from '@/lib/qaVideoPortrait'
import type { SmmBatchDetailMode } from '@/lib/smmBoard'
import { useTheme } from '@/theme'

function observerStatusClientFinal(row: DeliverableSidebarRow): string {
  const t = row.ticket
  if (!t) return 'No ticket'
  if (videoNeedsClientFinalReview(t)) return 'Waiting on client (final video)'
  const s = t.stageLabel.toLowerCase()
  if (t.owner === 'scheduling' && s.includes('approved')) return 'Client approved'
  if (t.owner === 'client') return t.stageLabel
  return t.stageLabel
}

function observerStatusThumb(row: DeliverableSidebarRow): string {
  const t = row.ticket
  if (!t) return 'No ticket'
  const s = t.stageLabel.toLowerCase()
  if (t.owner === 'client' && s.includes('thumbnail')) return 'Waiting on client (thumbnail)'
  if (t.owner === 'editor' && s.includes('thumbnail')) return 'Editor adding thumbnail'
  return t.stageLabel
}

type Props = {
  batch: AdminBatchFolder
  batchTickets: AdminVideoTicket[]
  clientName: string
  manifest: BatchDriveManifest | undefined
  mode: Extract<
    SmmBatchDetailMode,
    'observe_client_final' | 'observe_thumbnails' | 'observe_editor_cutting'
  >
}

/** Read-only observer views — Drive chrome lives in the modal header */
export function SmmSmmObserverWorkspace({ batch, batchTickets, clientName, mode, manifest }: Props) {
  const { theme } = useTheme()
  const manifestVideos = manifest?.videos

  const rows = useMemo(
    () => buildDeliverableSidebarRows(batch.id, manifestVideos, batchTickets),
    [batch.id, manifestVideos, batchTickets],
  )

  const [selectedIndex, setSelectedIndex] = useState(() => rows[0]?.index ?? 1)

  const selectedRow = rows.find((r) => r.index === selectedIndex) ?? rows[0] ?? null
  const qaTicket = selectedRow?.ticket
  const deliverablesFolder = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  const history = qaTicket ? flagsToQaComments(qaTicket, 'video') : []
  const qaCommentHistory = qaTicket?.qaCommentHistory ?? []
  const initialMarkers =
    qaCommentHistory.length > 0
      ? markersFromComments(qaCommentHistory)
      : (qaTicket?.qaFlags?.map((f) => ({ at: f.atSeconds, text: f.note })) ?? [])
  const initialGeneral =
    qaCommentHistory.length > 0
      ? generalFromComments(qaCommentHistory)
      : (qaTicket?.qaGeneralNote ?? '')

  const driveFileId = selectedRow?.entry?.driveFileId
  const fileName = selectedRow?.entry?.name

  const thumbEntry = getMediaEntry(
    batch.id,
    'thumbnails',
    selectedRow?.index ?? deliverableIndexForTicket(qaTicket ?? batchTickets[0]!),
  )

  if (mode === 'observe_editor_cutting') {
    return (
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <p className="text-muted-foreground text-sm leading-relaxed">
          <span className="text-foreground font-medium">{clientName}</span> — clips are approved and
          with the editor. Open the clips folder from the header if you need it on Drive; Studio is
          view-only here.
        </p>
        <div className="border-border rounded-xl border p-3">
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
            Videos in this batch
          </p>
          <ul className="space-y-2 text-sm">
            {batchTickets
              .filter((t) => t.deliverableIndex != null)
              .sort((a, b) => (a.deliverableIndex ?? 0) - (b.deliverableIndex ?? 0))
              .map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2">
                  <span className="text-foreground font-medium">Video {t.deliverableIndex}</span>
                  <span className="text-muted-foreground text-xs">{t.stageLabel}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    )
  }

  const sidebarLabel =
    mode === 'observe_client_final' ? 'Final video status' : 'Thumbnail status'

  const rowHint = (row: DeliverableSidebarRow) =>
    mode === 'observe_client_final'
      ? observerStatusClientFinal(row)
      : observerStatusThumb(row)

  if (!deliverablesFolder) {
    return (
      <p className="text-muted-foreground text-sm">Deliverables folder is not linked yet.</p>
    )
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No rows to show.</p>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <p className="text-muted-foreground shrink-0 text-sm">
        Observer only — you cannot approve or reject from this screen.
      </p>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row md:gap-4">
        <aside className="border-border bg-muted/15 flex max-h-[min(32vh,260px)] shrink-0 flex-col rounded-xl border pt-2 md:max-h-none md:w-56 md:bg-transparent md:pt-0">
          <p className="text-muted-foreground border-border hidden border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wide md:block">
            {sidebarLabel}
          </p>
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 md:px-0">
            {rows.map((row) => {
              const active = row.index === selectedRow?.index
              const hint = rowHint(row)
              return (
                <li key={row.index}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIndex(row.index)
                    }}
                    className={[
                      'flex w-full flex-col rounded-lg px-2 py-2 text-left text-xs transition-colors',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted/25 text-foreground',
                    ].join(' ')}
                  >
                    <span className="font-semibold tabular-nums">Video {row.index}</span>
                    <span
                      className={[
                        'mt-1 text-[10px] font-medium uppercase tracking-wide',
                        active ? 'text-primary-foreground/85' : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {hint}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto md:overflow-hidden">
          {!selectedRow ? (
            <p className="text-muted-foreground text-sm">Select a video on the left.</p>
          ) : mode === 'observe_thumbnails' ? (
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2 md:overflow-y-auto">
              <div className="space-y-2">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                  video_{selectedRow.index}
                </p>
                {driveFileId ? (
                  <DriveOrStreamVideo
                    driveFileId={driveFileId}
                    fileName={fileName}
                    layout="portrait"
                  />
                ) : (
                  <div
                    className={qaPortraitChromeClass}
                    style={{ boxShadow: `0 12px 40px -12px ${theme.colors.primary}22` }}
                  >
                    <div className={qaPortraitPlayerBoxClass} dir="ltr">
                      <video
                        className={qaPortraitVideoInnerClass}
                        controls
                        playsInline
                        preload="metadata"
                        src={SAMPLE_VIDEO_SRC}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                  thumbnail_{selectedRow.index}
                </p>
                {thumbEntry?.driveFileId ? (
                  <img
                    src={driveThumbnailUrl(thumbEntry.driveFileId)}
                    alt=""
                    className="border-border bg-muted/20 max-w-full rounded-xl border object-cover"
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Waiting for editor to upload a thumbnail file.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {history.length > 0 && (
                <QaCommentThread comments={history} heading="Earlier feedback" />
              )}
              {driveFileId ? (
                <DriveOrStreamVideo
                  driveFileId={driveFileId}
                  fileName={fileName}
                  layout="portrait"
                />
              ) : (
                <div
                  className={qaPortraitChromeClass}
                  style={{ boxShadow: `0 12px 40px -12px ${theme.colors.primary}22` }}
                >
                  <div className={qaPortraitPlayerBoxClass} dir="ltr">
                    <video
                      className={qaPortraitVideoInnerClass}
                      controls
                      playsInline
                      preload="metadata"
                      src={SAMPLE_VIDEO_SRC}
                    />
                  </div>
                </div>
              )}
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Notes: {initialGeneral || '—'}
              </p>
              <p className="text-muted-foreground text-[11px]">
                Markers logged: {initialMarkers.length > 0 ? initialMarkers.length : 'None'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
