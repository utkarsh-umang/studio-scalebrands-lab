import { useMemo } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  ListTodo,
  Send,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { useTheme } from '@/theme'
import { getMockEditorDashboard } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

const statusBadge = (status: string) => {
  if (status === 'qa_flagged') return 'QA inbox'
  if (status === 'smm_qa') return 'SMM QA'
  return 'Editing'
}

export function EditorOverview() {
  const { theme } = useTheme()
  const { user } = useMockAuth()
  const navigate = useNavigate()
  const data = getMockEditorDashboard()

  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const accent = theme.colors.accent
  const ink = theme.colors.foreground

  const greeting = useMemo(() => {
    const first = user?.name?.split(/\s+/)[0]
    return first ? `Hi, ${first}` : 'Hi there'
  }, [user?.name])

  return (
    <>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h2
          className="font-[family-name:var(--heading)] text-2xl font-bold tracking-tight md:text-3xl"
          style={{ color: ink }}
        >
          Your edit queue,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(115deg, ${primary}, ${secondary} 55%, ${accent})`,
            }}
          >
            one screen.
          </span>
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Active edits',
            value: data.counts.editing,
            sub: 'in your timeline',
            color: primary,
            bg: `${primary}14`,
          },
          {
            label: 'QA inbox',
            value: data.counts.qaInbox,
            sub: 'SMM flags to resolve',
            color: theme.colors.destructive,
            bg: `${theme.colors.destructive}12`,
          },
          {
            label: 'With SMM QA',
            value: data.counts.withSmmQa,
            sub: 'awaiting their pass',
            color: secondary,
            bg: `${secondary}14`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="border-border bg-background/85 rounded-2xl border p-4 backdrop-blur-xl"
            style={{
              borderColor: `${s.color}35`,
              boxShadow: `
                0 16px 48px -14px rgba(5, 9, 14, 0.12),
                0 0 0 1px rgba(255, 255, 255, 0.55) inset
              `,
            }}
          >
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.12em]">
              {s.label}
            </p>
            <p
              className="font-[family-name:var(--heading)] mt-1 text-3xl font-bold tabular-nums"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-foreground size-5" aria-hidden />
          <h3 className="text-foreground text-base font-semibold">
            QA inbox — needs your fix
          </h3>
        </div>
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          {data.needsAttention.length === 0 ? (
            <p className="text-muted-foreground p-5 text-sm">
              Nothing in QA inbox — you are caught up.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {data.needsAttention.map((row) => (
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
                      style={{ background: `${theme.colors.destructive}14` }}
                    >
                      <AlertTriangle
                        className="size-4 text-foreground/80"
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground font-medium">{row.batchTitle}</p>
                      <p className="text-muted-foreground text-xs">
                        {row.accountLabel} · {row.stageLabel}
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
      </section>

      <section className="space-y-3">
        <ClientPageHeader
          title="Other assigned work"
          subtitle="Editing in progress or with SMM — open a task to deliver or track status."
        />
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <ul className="divide-border divide-y">
            {data.inProgress.map((row) => (
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
                        row.status === 'smm_qa'
                          ? `${secondary}14`
                          : `${primary}12`,
                    }}
                  >
                    {row.status === 'smm_qa' ? (
                      <Send className="size-4 text-foreground/80" aria-hidden />
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
                      {row.accountLabel} · {statusBadge(row.status)} · Updated{' '}
                      {formatDate(row.updatedAt)}
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
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ListTodo className="text-foreground size-5" aria-hidden />
          <h3 className="text-foreground text-base font-semibold">Full task list</h3>
        </div>
        <p className="text-muted-foreground text-xs">
          Every assignment lives under{' '}
          <strong className="text-foreground/90">My tasks</strong> in the sidebar;
          QA-flagged items are also under <strong className="text-foreground/90">QA inbox</strong>.
        </p>
        <button
          type="button"
          onClick={() => {
            navigate('/editor/tasks')
          }}
          className="border-border bg-background/85 text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold backdrop-blur-xl transition-colors"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          Open my tasks
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </section>
    </>
  )
}
