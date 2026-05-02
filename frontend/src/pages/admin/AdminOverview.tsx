import { useMemo } from 'react'
import { BarChart3, CalendarClock, ChevronRight, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMockAuth } from '@/auth'
import { useTheme } from '@/theme'
import {
  MOCK_ADMIN_PIPELINE_ITEMS,
  MOCK_ADMIN_PIPELINE_SUMMARY,
  type PipelineOwnerKind,
} from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

const ownerLabel: Record<PipelineOwnerKind, string> = {
  client: 'With client',
  smm: 'With SMM',
  editor: 'With editor',
}

const ownerAccent: Record<
  PipelineOwnerKind,
  'primary' | 'secondary' | 'accent'
> = {
  client: 'accent',
  smm: 'primary',
  editor: 'secondary',
}

export function AdminOverview() {
  const { theme } = useTheme()
  const { user } = useMockAuth()
  const navigate = useNavigate()
  const summary = MOCK_ADMIN_PIPELINE_SUMMARY
  const items = MOCK_ADMIN_PIPELINE_ITEMS

  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const accent = theme.colors.accent
  const ink = theme.colors.foreground

  const totalActive =
    summary.withClient + summary.withSmm + summary.withEditor

  const greeting = useMemo(() => {
    const first = user?.name?.split(/\s+/)[0]
    return first ? `Hi, ${first}` : 'Hi there'
  }, [user?.name])

  const statCards = [
    {
      key: 'client' as const,
      label: ownerLabel.client,
      value: summary.withClient,
      sub: 'awaiting client action',
      color: accent,
    },
    {
      key: 'smm' as const,
      label: ownerLabel.smm,
      value: summary.withSmm,
      sub: 'SMM-owned steps',
      color: primary,
    },
    {
      key: 'editor' as const,
      label: ownerLabel.editor,
      value: summary.withEditor,
      sub: 'editing & fixes',
      color: secondary,
    },
  ]

  return (
    <>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h2
          className="font-[family-name:var(--heading)] text-2xl font-bold tracking-tight md:text-3xl"
          style={{ color: ink }}
        >
          Pipeline health,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(115deg, ${primary}, ${secondary} 55%, ${accent})`,
            }}
          >
            at a glance.
          </span>
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <div
            key={s.key}
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

      <div
        className="border-border bg-background/85 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="text-foreground size-5" aria-hidden />
          <div>
            <p className="text-foreground text-sm font-semibold">
              Active batches
            </p>
            <p className="text-muted-foreground text-xs">
              {totalActive} open owner slots across all clients (prototype
              counts).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            navigate('/admin/clients')
          }}
          className="border-border bg-background/85 text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-xl transition-colors"
        >
          <Users className="size-3.5" aria-hidden />
          Manage clients
        </button>
      </div>

      <section className="space-y-3">
        <ClientPageHeader
          title="Where work sits"
          subtitle="Read-only snapshot of active batches — grouped by who owns the next step."
        />
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <ul className="divide-border divide-y">
            {items.map((row) => {
              const colorKey = ownerAccent[row.owner]
              const chipColor =
                colorKey === 'primary'
                  ? primary
                  : colorKey === 'secondary'
                    ? secondary
                    : accent
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-foreground font-medium">
                      {row.batchTitle}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {row.clientLabel} · {row.stageLabel} · Updated{' '}
                      {formatDate(row.updatedAt)}
                    </p>
                  </div>
                  <span
                    className="inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      background: `${chipColor}18`,
                      color: chipColor,
                      border: `1px solid ${chipColor}40`,
                    }}
                  >
                    {ownerLabel[row.owner]}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="text-foreground size-5" aria-hidden />
          <h3 className="text-foreground text-base font-semibold">
            Deadlines
          </h3>
        </div>
        <p className="text-muted-foreground text-xs">
          Set and adjust internal due dates on{' '}
          <strong className="text-foreground/90">SMM</strong> and{' '}
          <strong className="text-foreground/90">Editor</strong> tasks from the
          Deadlines page.
        </p>
        <button
          type="button"
          onClick={() => {
            navigate('/admin/deadlines')
          }}
          className="border-border bg-background/85 text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold backdrop-blur-xl transition-colors"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          Open deadlines
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </section>
    </>
  )
}
