import { ChevronRight, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_CLIENT_FINAL_REVIEW_INDEX } from '@mockData/index'
import { ClientPageHeader, formatDate } from './clientPageUtils'

export function ClientFinalReviewList() {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary

  return (
    <>
      <ClientPageHeader
        title="Final review"
        subtitle="Finished video + thumbnail — open a deliverable to add QA-style feedback."
      />

      <div
        className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        {MOCK_CLIENT_FINAL_REVIEW_INDEX.length === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">
            Nothing in final review right now.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {MOCK_CLIENT_FINAL_REVIEW_INDEX.map((row) => (
              <li key={row.batchId}>
                <Link
                  to={`/client/final-review/${row.batchId}`}
                  className="hover:bg-muted/40 flex items-center gap-3 px-5 py-4 transition-colors"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                    }}
                  >
                    <PlayCircle className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-xs">{row.subtitle}</p>
                  </div>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatDate(row.updatedAt)}
                  </span>
                  <span
                    className="text-primary shrink-0 text-xs font-semibold"
                  >
                    Open review
                  </span>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
