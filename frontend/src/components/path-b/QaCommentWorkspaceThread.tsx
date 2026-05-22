import type { QaComment } from '@mockData/index'

type Props = {
  comments: QaComment[]
  className?: string
}

function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function sortNewestFirst(comments: QaComment[]): QaComment[] {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function CommentBody({ comment }: { comment: QaComment }) {
  const role = comment.authorRole.toUpperCase()
  if (comment.kind === 'timestamp' && comment.atSeconds != null) {
    return (
      <>
        <span className="text-muted-foreground text-[10px] font-semibold">
          {role} · {formatTs(comment.atSeconds)}
        </span>
        <p className="text-foreground/90 mt-0.5 leading-snug">{comment.body}</p>
      </>
    )
  }
  return (
    <>
      <span className="text-muted-foreground text-[10px] font-semibold">{role}</span>
      <p className="text-foreground/90 mt-0.5 leading-snug">{comment.body}</p>
    </>
  )
}

export function QaCommentWorkspaceThread({ comments, className = '' }: Props) {
  if (comments.length === 0) {
    return (
      <p className={`text-muted-foreground text-sm ${className}`.trim()}>
        No comments yet.
      </p>
    )
  }

  const sorted = sortNewestFirst(comments)
  const active = sorted.filter((c) => !c.deprecated)
  const sold = sorted.filter((c) => c.deprecated)

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {active.length > 0 && (
        <ul className="space-y-3">
          {active.map((c) => (
            <li
              key={c.id}
              className="border-border bg-background rounded-lg border px-3 py-2.5 text-sm"
            >
              <CommentBody comment={c} />
            </li>
          ))}
        </ul>
      )}
      {sold.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
            Sold — prior version (re-uploaded)
          </p>
          <ul className="space-y-2">
            {sold.map((c) => (
              <li
                key={c.id}
                className="border-border/60 bg-muted/10 text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-sm line-through decoration-muted-foreground/40"
              >
                <CommentBody comment={c} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
