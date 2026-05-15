import { useState } from 'react'
import { Check, ExternalLink, X } from 'lucide-react'
import type { ClientClipReviewDetail } from '@mockData/index'
import { useTheme } from '@/theme'

type Props = {
  detail: ClientClipReviewDetail
  onApprove: () => void
  onReject: (note: string) => void
}

export function ClientClipReviewPanel({ detail, onApprove, onReject }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center px-2 py-4 text-center">
      <a
        href={detail.clipsFolderUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-muted/30 hover:border-primary/35 flex w-full max-w-md items-center justify-center gap-2 rounded-xl border px-6 py-4 text-base font-semibold transition-colors"
        style={{ color: primary }}
      >
        <ExternalLink className="size-5 shrink-0" aria-hidden />
        Open clips folder on Drive
      </a>

      <div className="text-muted-foreground mt-8 max-w-lg space-y-3 text-sm leading-relaxed">
        <p className="text-foreground font-medium">What to do</p>
        <ol className="list-decimal space-y-2 text-left pl-5">
          <li>Open the Drive folder and review each clip file.</li>
          <li>
            If everything looks good, click <strong className="text-foreground">Approve</strong>{' '}
            — we&apos;ll send the batch to your editor.
          </li>
          <li>
            If something needs to change, click <strong className="text-foreground">Reject</strong>
            , tell us which clip number(s) and what to fix, and our team will re-cut and send
            a new folder link.
          </li>
        </ol>
      </div>

      {showRejectForm && (
        <div className="mt-8 w-full max-w-lg space-y-2 text-left">
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

      <div className="mt-auto flex w-full max-w-md justify-center gap-3 pt-10">
        <button
          type="button"
          onClick={onApprove}
          className="inline-flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl bg-[var(--success)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          <Check className="size-4" aria-hidden />
          Approve
        </button>
        {!showRejectForm ? (
          <button
            type="button"
            onClick={() => {
              setShowRejectForm(true)
            }}
            className="border-border text-foreground hover:bg-muted/50 inline-flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl border px-6 py-2.5 text-sm font-semibold"
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
            className="border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive/10 inline-flex min-w-[160px] items-center justify-center gap-1.5 rounded-xl border px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Send rejection
          </button>
        )}
      </div>
    </div>
  )
}
