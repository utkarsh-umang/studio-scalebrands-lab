import { AlertTriangle, ChevronRight, ClipboardList } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/theme'
import { listEditorTaskSummaries, type EditorTaskSummary } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

function kindLabel(kind: EditorTaskSummary['kind']): string {
  return kind === 'raw_footage_clip' ? 'Raw footage → clips' : 'Full edit'
}

function statusLabel(row: EditorTaskSummary): string {
  if (row.status === 'qa_flagged') return 'QA flagged'
  if (row.status === 'smm_qa') return 'With SMM QA'
  return 'Editing'
}

export function EditorTasksList() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isQaOnly = location.pathname.endsWith('/qa')

  const rows = useMemo(() => {
    const all = listEditorTaskSummaries()
    if (isQaOnly) return all.filter((t) => t.status === 'qa_flagged')
    return all
  }, [isQaOnly])

  const primary = theme.colors.primary

  return (
    <>
      <ClientPageHeader
        title={isQaOnly ? 'QA inbox' : 'My tasks'}
        subtitle={
          isQaOnly
            ? 'SMM raised flags — resolve in the edit, then resubmit for re-review.'
            : 'Everything assigned to you: clip work, full edits, and QA return loops.'
        }
      />

      <div
        className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
        style={{
          boxShadow: `
            0 20px 60px -18px rgba(5, 9, 14, 0.14),
            0 0 0 1px rgba(255, 255, 255, 0.55) inset
          `,
        }}
      >
        {rows.length === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">
            {isQaOnly
              ? 'No QA-flagged tasks — check My tasks for active work.'
              : 'No tasks assigned.'}
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/editor/tasks/${row.id}`)
                  }}
                  className="hover:bg-muted/40 flex w-full items-center gap-3 px-5 py-4 text-left transition-colors"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background:
                        row.status === 'qa_flagged'
                          ? `${theme.colors.destructive}14`
                          : `${primary}12`,
                    }}
                  >
                    {row.status === 'qa_flagged' ? (
                      <AlertTriangle
                        className="size-4 text-foreground/80"
                        aria-hidden
                      />
                    ) : (
                      <ClipboardList
                        className="size-4 text-foreground/80"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium">{row.batchTitle}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.accountLabel} · {kindLabel(row.kind)} ·{' '}
                      {statusLabel(row)}
                      {row.deadline && (
                        <span className="text-foreground/80">
                          {' '}
                          · Due {formatDate(row.deadline)}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
