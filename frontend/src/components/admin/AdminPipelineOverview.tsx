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
      sub: 'videos waiting on client',
      color: accent,
    },
    {
      key: 'smm' as const,
      label: ownerLabel.smm,
      value: summary.withSmm,
      sub: 'videos with SMM as next owner',
      color: primary,
    },
    {
      key: 'editor' as const,
      label: ownerLabel.editor,
      value: summary.withEditor,
      sub: 'videos with editor as next owner',
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
            <p className="text-foreground text-sm font-semibold">Open work</p>
            <p className="text-muted-foreground text-xs">
              {totalActive} open item{totalActive === 1 ? '' : 's'} across all clients —
              one per video once a batch is split, otherwise one per batch.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <ClientPageHeader
          title="Where work sits"
          subtitle="Videos grouped by batch, showing who owns the next step."
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
                const isVideo = row.kind === 'video'
                const colorKey = row.owner ? ownerAccent[row.owner] : null
                const chipColor =
                  colorKey === 'primary'
                    ? primary
                    : colorKey === 'secondary'
                      ? secondary
                      : colorKey === 'accent'
                        ? accent
                        : null

                const primaryText = isVideo
                  ? `#${row.deliverableIndex} · ${row.stageLabel}`
                  : row.batchTitle
                const secondaryText = isVideo
                  ? (row.scheduleLabel ?? row.clientLabel)
                  : [
                      row.clientLabel,
                      row.totalVideoCount != null
                        ? `${row.openVideoCount ?? 0} of ${row.totalVideoCount} open`
                        : row.stageLabel,
                      `Updated ${formatDate(row.updatedAt)}`,
                    ].join(' · ')

                return (
                  <li key={row.id} className={isVideo ? 'bg-muted/10' : undefined}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(
                          `/admin/clients/${row.clientId}?batch=${encodeURIComponent(row.batchId)}`,
                        )
                      }}
                      className={[
                        'hover:bg-muted/20 flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between',
                        isVideo ? 'py-2.5 pl-10 pr-5' : 'px-5 py-4',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <p
                          className={
                            isVideo
                              ? 'text-foreground text-sm'
                              : 'text-foreground font-medium'
                          }
                        >
                          {primaryText}
                        </p>
                        <p className="text-muted-foreground text-xs">{secondaryText}</p>
                      </div>
                      {chipColor && row.owner ? (
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
                      ) : isVideo ? (
                        // Delivered: say so explicitly rather than leaving a blank
                        // row that reads as "nothing happening here".
                        <span className="border-border text-muted-foreground inline-flex w-fit shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          {row.scheduleLabel ? 'Scheduled' : 'Done'}
                        </span>
                      ) : null}
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
