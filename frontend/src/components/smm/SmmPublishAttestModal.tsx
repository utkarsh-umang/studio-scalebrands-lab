import { X } from 'lucide-react'
import type { AdminBatchFolder } from '@mockData/index'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'
import { useTheme } from '@/theme'

type Props = {
  batch: AdminBatchFolder
  clientName: string
  attestPurpose?: 'schedule_publish' | 'titles_prep'
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SmmPublishAttestModal({
  batch,
  clientName,
  attestPurpose = 'schedule_publish',
  open,
  onClose,
  onConfirm,
}: Props) {
  const { theme } = useTheme()
  const { smmFinalizeBatchPublish } = useAdminWorkspace()
  const primary = theme.colors.primary

  if (!open) return null

  function handleConfirm() {
    smmFinalizeBatchPublish(batch.id)
    onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smm-publish-attest-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="border-border bg-background relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-xl"
        style={{
          boxShadow: `0 24px 80px -20px rgba(5, 9, 14, 0.25), 0 0 0 1px ${primary}18 inset`,
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p
              id="smm-publish-attest-title"
              className="text-foreground font-[family-name:var(--heading)] text-lg font-bold"
            >
              {attestPurpose === 'titles_prep'
                ? 'Confirm titles prep complete?'
                : 'Mark batch completed?'}
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-snug">
              {attestPurpose === 'titles_prep' ? (
                <>
                  Confirm you&apos;ve finished offline scheduling prep for{' '}
                  <span className="text-foreground font-medium">{batch.title}</span> —{' '}
                  <span className="text-foreground font-medium">{clientName}</span>. This closes the
                  batch in Studio and applies the client credit debit when every deliverable is in a
                  terminal state.
                </>
              ) : (
                <>
                  Only confirm if you have already scheduled{' '}
                  <strong className="text-foreground">all</strong> videos in{' '}
                  <span className="text-foreground font-medium">{batch.title}</span> for{' '}
                  <span className="text-foreground font-medium">{clientName}</span> on the agreed
                  social platforms. This closes the batch in Studio and applies the client credit debit.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-border bg-background text-foreground hover:bg-muted/60 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: primary }}
          >
            {attestPurpose === 'titles_prep' ? 'Yes, prep is complete' : 'Yes, all videos are scheduled'}
          </button>
        </div>
      </div>
    </div>
  )
}
