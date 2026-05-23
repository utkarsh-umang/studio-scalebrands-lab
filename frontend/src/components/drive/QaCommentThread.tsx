import type { QaComment } from '@/types/pathB'

type Props = {
  comments: QaComment[]
  heading?: string
}

function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function QaCommentThread({ comments, heading = 'Feedback history' }: Props) {
  if (comments.length === 0) return null

  const active = comments.filter((c) => !c.deprecated)
  const deprecated = comments.filter((c) => c.deprecated)

  return (
    <div className="border-border bg-muted/15 space-y-3 rounded-xl border p-4 text-left">
      <p className="text-foreground text-xs font-semibold uppercase tracking-wide">{heading}</p>
      {active.length > 0 && (
        <ul className="space-y-2 text-sm">
          {active.map((c) => (
            <li key={c.id} className="text-foreground/90 leading-snug">
              <CommentLine comment={c} />
            </li>
          ))}
        </ul>
      )}
      {deprecated.length > 0 && (
        <details className="text-muted-foreground text-sm">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide">
            Previous version ({deprecated.length})
          </summary>
          <ul className="mt-2 space-y-2 opacity-70">
            {deprecated.map((c) => (
              <li key={c.id} className="line-through decoration-muted-foreground/50">
                <CommentLine comment={c} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function CommentLine({ comment }: { comment: QaComment }) {
  const role = comment.authorRole.toUpperCase()
  if (comment.kind === 'timestamp' && comment.atSeconds != null) {
    return (
      <>
        <span className="text-muted-foreground text-[10px] font-semibold">
          {role} · {formatTs(comment.atSeconds)}
        </span>
        <p className="mt-0.5">{comment.body}</p>
      </>
    )
  }
  return (
    <>
      <span className="text-muted-foreground text-[10px] font-semibold">{role}</span>
      <p className="mt-0.5">{comment.body}</p>
    </>
  )
}
