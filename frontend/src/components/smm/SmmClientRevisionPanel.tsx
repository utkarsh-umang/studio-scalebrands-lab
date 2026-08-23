import type { AdminVideoTicket, QaComment } from '@/types/pathB'
import { QaReviewAttachment } from '@/components/qa/QaReviewAttachment'
import { useTheme } from '@/theme'

function formatTimestamp(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

type Props = {
  ticket: AdminVideoTicket
  clientComments: QaComment[]
  onRouteToEditor: () => void
  onUpdateAssets: () => void
}

export function SmmClientRevisionPanel({
  ticket,
  clientComments,
  onRouteToEditor,
  onUpdateAssets,
}: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        The client requested changes on{' '}
        <span className="text-foreground font-medium">{ticket.title}</span>. Triage
        offline, then route the fix — video edits always go through the editor; thumb or
        title can stay with you.
      </p>

      <div className="border-border rounded-xl border p-3">
        <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
          Client comments
        </p>
        {clientComments.length === 0 ? (
          <p className="text-muted-foreground text-xs">No client comments on file yet.</p>
        ) : (
          <ul className="space-y-2">
            {clientComments.map((c) => (
              <li
                key={c.id}
                className="bg-muted/20 text-foreground rounded-lg px-3 py-2.5 text-xs leading-relaxed"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-blue-700">
                  {c.atSeconds != null ? <span>{formatTimestamp(c.atSeconds)}</span> : null}
                  <span className="text-muted-foreground">Video v{c.assetVersion}</span>
                </div>
                <p>{c.body}</p>
                {c.attachments?.length ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {c.attachments.map((attachment) => (
                      <QaReviewAttachment
                        key={attachment.assetId}
                        assetId={attachment.assetId}
                        fileName={attachment.fileName}
                        contentType={attachment.contentType}
                        compact
                      />
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onRouteToEditor}
          className="border-border hover:bg-muted/40 rounded-xl border px-4 py-2.5 text-sm font-semibold"
        >
          Send to editor (video fix)
        </button>
        <button
          type="button"
          onClick={onUpdateAssets}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ background: primary }}
        >
          I&apos;ll update thumbnail or title
        </button>
      </div>
    </div>
  )
}
