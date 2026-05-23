import { BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'
import type { AdminPipelineItem, AdminPipelineSummary } from '@/lib/adminPipeline'
import type { PipelineOwnerKind } from '@/types/pathB'
import { useTheme } from '@/theme'

const ownerLabel: Record<PipelineOwnerKind, string> = {
  client: 'With client',
  smm: 'With SMM',
  editor: 'With editor',
}

const ownerAccent: Record<PipelineOwnerKind, 'primary' | 'secondary' | 'accent'> = {
  client: 'accent',
  smm: 'primary',
  editor: 'secondary',
}

type Props = {
  summary: AdminPipelineSummary
  items: AdminPipelineItem[]
}

export function AdminPipelineOverview({ summary, items }: Props) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const accent = theme.colors.accent

  const totalActive = summary.withClient + summary.withSmm + summary.withEditor

  const statCards = [
    {
      key: 'client' as const,
      label: ownerLabel.client,
      value: summary.withClient,
      sub: 'batches waiting on client',
      color: accent,
    },
    {
      key: 'smm' as const,
      label: ownerLabel.smm,
      value: summary.withSmm,
      sub: 'batches with SMM as next owner',
      color: primary,
    },
    {
      key: 'editor' as const,
      label: ownerLabel.editor,
      value: summary.withEditor,
      sub: 'batches with editor as next owner',
      color: secondary,
    },
  ]

  return (
    <section className="space-y-6">
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
        style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="text-foreground size-5" aria-hidden />
          <div>
            <p className="text-foreground text-sm font-semibold">Active batches</p>
            <p className="text-muted-foreground text-xs">
              {totalActive} open batch{totalActive === 1 ? '' : 'es'} across all clients
              (live from workspace).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <ClientPageHeader
          title="Where work sits"
          subtitle="Path B batches grouped by who owns the next step."
        />
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
        >
          {items.length === 0 ? (
            <p className="text-muted-foreground px-5 py-8 text-center text-sm">
              No active batches in the workspace.
            </p>
          ) : (
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
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(
                          `/admin/clients/${row.clientId}?batch=${encodeURIComponent(row.id)}`,
                        )
                      }}
                      className="hover:bg-muted/20 flex w-full flex-col gap-2 px-5 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-foreground font-medium">{row.batchTitle}</p>
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
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
