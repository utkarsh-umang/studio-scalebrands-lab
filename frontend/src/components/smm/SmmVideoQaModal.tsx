import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { SubmitSmmQaRequest } from '@/client'
import type { AdminBatchFolder, AdminVideoTicket } from '@/types/pathB'
import { StudioModalShell } from '@/components/StudioModalShell'
import {
  DriveSyncButton,
  DriveSyncMeta,
  QaCommentWorkspace,
} from '@/components/path-b'
import {
  useAppendQaCommentMutation,
  useSubmitSmmQaMutation,
} from '@/hooks/api/pathB/useSmmQaMutations'
import {
  useDeliverableDriveSyncMutation,
  useUpdateProductionMutation,
} from '@/hooks/api/pathB/useProductionMutations'
import { driveSyncRequestFromManifest } from '@/lib/productionDriveSync'
import { apiErrorMessage } from '@/lib/apiError'
import { SmmQaTitleField } from '@/components/smm/SmmQaTitleField'
import { useDriveManifestSync } from '@/hooks/useDriveManifestSync'
import { deliverableIndexForTicket, getMediaEntry } from '@/lib/driveMedia'
import { activeCommentsForSlot } from '@/lib/qaComments'
import { videoNeedsSmmQa } from '@/lib/smmBoard'
import { studioMediaSlot } from '@/lib/studioMedia'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  ticket: AdminVideoTicket
  open: boolean
  onClose: () => void
}

export function SmmVideoQaModal({
  batch,
  clientName,
  ticket,
  open,
  onClose,
}: Props) {
  const submitSmmQa = useSubmitSmmQaMutation(ticket.id)
  const appendComment = useAppendQaCommentMutation(ticket.id)
  const updateProduction = useUpdateProductionMutation(ticket.id)
  const driveSync = useDeliverableDriveSyncMutation(ticket.id)
  const { manifest, syncing, error, sync } = useDriveManifestSync(
    batch.id,
    open ? ticket.id : undefined,
  )

  const index = deliverableIndexForTicket(ticket)
  const canAct = videoNeedsSmmQa(ticket)
  const comments = useMemo(
    () => activeCommentsForSlot(ticket.qaCommentHistory, 'video'),
    [ticket.qaCommentHistory],
  )

  const videoEntry =
    manifest?.videos.find((e) => e.index === index) ??
    getMediaEntry(batch.id, 'videos', index)
  const thumbEntry =
    manifest?.thumbnails.find((e) => e.index === index) ??
    getMediaEntry(batch.id, 'thumbnails', index)
  const studioVideo = studioMediaSlot(ticket, 'video')
  const studioThumbnail = studioMediaSlot(ticket, 'thumbnail')
  const folderUrl = batch.editorDeliverablesDriveUrl?.trim() ?? ''

  // Syncing must record the files on the ticket, not just refresh the manifest:
  // only recorded slots count towards readiness, so a thumbnail the SMM can see
  // would still block approval.
  const handleSyncDrive = async () => {
    const nextManifest = await sync()
    const body = driveSyncRequestFromManifest(index, nextManifest)
    if (!body) return
    driveSync.mutate(body)
  }

  const actionError = submitSmmQa.isError
    ? apiErrorMessage(submitSmmQa.error, 'Could not submit this QA decision.')
    : driveSync.isError
      ? apiErrorMessage(driveSync.error, 'Could not record the Drive files.')
      : null

  // The editor hands off once their part is done, so an SMM-owned title is
  // normally still blank here — this is where it gets written.
  const showTitleField =
    batch.titleOwnerKind === 'smm' || !ticket.editorPublishTitle?.trim()

  if (!open) return null

  return (
    <StudioModalShell
      title="SMM QA"
      subtitle={`${clientName} · #${index} · ${ticket.title}`}
      titleId="smm-video-qa-title"
      onClose={onClose}
      headerAside={
        folderUrl ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DriveSyncButton
              onSync={() => {
                void handleSyncDrive()
              }}
              syncing={syncing || driveSync.isPending}
            />
            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-muted/30 hover:border-primary/35 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
            >
              Deliverables folder
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          </div>
        ) : null
      }
      headerMeta={<DriveSyncMeta manifest={manifest} errorMessage={error} />}
      bodyScroll
    >
      {!canAct ? (
        <p className="text-muted-foreground text-sm">
          This deliverable is not in SMM QA right now. Close and pick another card.
        </p>
      ) : (
        <div className="space-y-4">
        {showTitleField ? (
          <SmmQaTitleField
            ticket={ticket}
            pending={updateProduction.isPending}
            error={
              updateProduction.isError
                ? apiErrorMessage(updateProduction.error, 'Could not save the title.')
                : null
            }
            onSave={(title) => {
              updateProduction.mutate({ editorPublishTitle: title })
            }}
          />
        ) : null}

        {actionError ? (
          <p className="text-destructive text-xs leading-relaxed" role="alert">
            {actionError}
          </p>
        ) : null}

        <QaCommentWorkspace
          role="smm"
          videoTitle={ticket.title}
          deliverableIndex={index}
          comments={comments}
          videoDriveFileId={videoEntry?.driveFileId}
          videoAssetId={studioVideo?.assetId}
          videoFileName={studioVideo?.name ?? videoEntry?.name}
          thumbnailDriveFileId={thumbEntry?.driveFileId}
          thumbnailAssetId={studioThumbnail?.assetId}
          thumbnailFileName={studioThumbnail?.name ?? thumbEntry?.name}
          displayVideoTitle={ticket.editorPublishTitle ?? ticket.title}
          onAddComment={(body) => {
            appendComment.mutate({ body })
          }}
          onApprove={() => {
            submitSmmQa.mutate(
              { action: SubmitSmmQaRequest.action.APPROVE },
              {
                onSuccess: () => {
                  onClose()
                },
              },
            )
          }}
          onRequestChanges={(body) => {
            submitSmmQa.mutate(
              { action: SubmitSmmQaRequest.action.SEND_BACK, commentBody: body },
              {
                onSuccess: () => {
                  onClose()
                },
              },
            )
          }}
        />
        </div>
      )}
    </StudioModalShell>
  )
}
