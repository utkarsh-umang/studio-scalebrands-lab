import { useMemo } from 'react'
import {
  Calendar,
  ChevronRight,
  Film,
  ListTodo,
  Users,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { useTheme } from '@/theme'
import {
  MOCK_SMM_DASHBOARD,
  type SmmAttentionKind,
} from '@mockData/index'
import { ClientPageHeader, formatDate, formatDateTime } from '@/pages/client/clientPageUtils'

function actionHref(row: {
  id: string
  attention?: SmmAttentionKind
}): string {
  if (row.attention === 'clip_identification') return `/smm/clips/${row.id}`
  if (row.attention === 'idea_research') return `/smm/ideas/${row.id}`
  if (row.attention === 'text_creation') return `/smm/titles/${row.id}`
  if (row.attention === 'smm_qa') return `/smm/qa/${row.id}`
  if (row.attention === 'scheduling') return `/smm/scheduling/${row.id}`
  return '/smm/overview'
}

const attentionCopy: Record<SmmAttentionKind, string> = {
  clip_identification: 'Find clips',
  idea_research: 'Idea research',
  text_creation: 'Titles & copy',
  smm_qa: 'Video QA',
  scheduling: 'Scheduling',
}

export function SmmOverview() {
  const { theme } = useTheme()
  const { user } = useMockAuth()
  const navigate = useNavigate()
  const data = MOCK_SMM_DASHBOARD

  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const accent = theme.colors.accent
  const ink = theme.colors.foreground

  const greeting = useMemo(() => {
    const first = user?.name?.split(/\s+/)[0]
    return first ? `Hi, ${first}` : 'Hi there'
  }, [user?.name])

  const pending = data.needsAttention.length

  return (
    <>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h2
          className="font-[family-name:var(--heading)] text-2xl font-bold tracking-tight md:text-3xl"
          style={{ color: ink }}
        >
          SMM pipeline,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(115deg, ${primary}, ${secondary} 55%, ${accent})`,
            }}
          >
            one queue.
          </span>
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Needs your action',
            value: pending,
            sub: 'clips, copy, QA, or schedule',
            color: theme.colors.destructive,
            bg: `${theme.colors.destructive}12`,
          },
          {
            label: 'With client',
            value: data.withClient.length,
            sub: 'awaiting approval',
            color: primary,
            bg: `${primary}14`,
          },
          {
            label: 'With editor',
            value: data.withEditor.length,
            sub: 'editing or fixing QA',
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
          <ListTodo className="text-foreground size-5" aria-hidden />
          <h3 className="text-foreground text-base font-semibold">
            Action required
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
              You&apos;re caught up — check back when new batches land.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {data.needsAttention.map((row) => {
                const dest = actionHref(row)
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(dest)
                      }}
                      className="hover:bg-muted/40 flex w-full items-center gap-3 px-5 py-4 text-left transition-colors"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${primary}12` }}
                      >
                        <Film className="size-4 text-foreground/80" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground font-medium">{row.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {row.clientName} · {row.stageLabel}
                          {row.attention && (
                            <span className="text-foreground/80">
                              {' '}
                              · {attentionCopy[row.attention]}
                            </span>
                          )}
                        </p>
                        {row.deadline && (
                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            Deadline {formatDate(row.deadline)}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <ClientPageHeader
          title="Waiting on client"
          subtitle="No action from you until they respond."
        />
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <ul className="divide-border divide-y">
            {data.withClient.map((row) => (
              <li
                key={row.id}
                className="text-muted-foreground flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-foreground font-medium">{row.title}</span>
                <span className="text-xs">
                  {row.clientName} · {row.stageLabel} · Updated{' '}
                  {formatDate(row.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="text-foreground size-5" aria-hidden />
          <h3 className="text-foreground text-base font-semibold">
            With editor
          </h3>
        </div>
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <ul className="divide-border divide-y">
            {data.withEditor.map((row) => (
              <li
                key={row.id}
                className="text-muted-foreground flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-foreground font-medium">{row.title}</span>
                <span className="text-xs">
                  {row.clientName} · {row.stageLabel}
                  {row.deadline && (
                    <>
                      {' '}
                      · Due {formatDateTime(`${row.deadline}T17:00:00.000Z`)}
                    </>
                  )}
                  {!row.deadline && (
                    <> · Updated {formatDate(row.updatedAt)}</>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="text-foreground size-5" aria-hidden />
          <h3 className="text-foreground text-base font-semibold">
            Quick links
          </h3>
        </div>
        <p className="text-muted-foreground text-xs">
          Deep work lives in the sidebar: clip finding, ideas, titles, QA, and
          scheduling.
        </p>
        <button
          type="button"
          onClick={() => {
            navigate('/smm/scheduling')
          }}
          className="border-border bg-background/85 text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold backdrop-blur-xl transition-colors"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <Calendar className="size-4" aria-hidden />
          Open scheduling
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </section>
    </>
  )
}
