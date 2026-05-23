import { ExternalLink, Scissors } from 'lucide-react'
import { StudioModalShell } from '@/components/StudioModalShell'
import type { AdminBatchFolder } from '@/types/pathB'

type Props = {
  batch: AdminBatchFolder
  batchTitle: string
  onClose: () => void
}

export function ClientClipIdentificationStatusModal({
  batch,
  batchTitle,
  onClose,
}: Props) {
  const rawUrl =
    batch.sourceMediaUrl?.trim() || batch.footageUrl?.trim() || ''

  return (
    <StudioModalShell
      title="Clip identification in progress"
      subtitle={`${batchTitle} · In progress`}
      titleId="client-clip-identification-title"
      onClose={onClose}
    >
      <div className="border-primary/25 bg-primary/5 space-y-4 rounded-xl border px-4 py-4">
        <p className="text-foreground flex items-start gap-2 text-sm leading-relaxed">
          <Scissors className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Our team is reviewing your source footage and preparing numbered clips in Drive.
            When identification is complete, you&apos;ll get a card here to{' '}
            <strong>approve the clip list</strong> before we start editing.
          </span>
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          You don&apos;t need to take action on this step — we&apos;ll notify you when clip
          approval is ready.
        </p>
      </div>

      {rawUrl ? (
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border hover:border-primary/35 text-primary mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          Open source footage
          <ExternalLink className="size-4 opacity-80" aria-hidden />
        </a>
      ) : (
        <p className="text-muted-foreground mt-4 text-xs">
          Source link will appear here once your intake is linked on this batch.
        </p>
      )}
    </StudioModalShell>
  )
}
