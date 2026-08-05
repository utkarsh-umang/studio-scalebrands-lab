import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  Film,
  FolderOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import {
  clientCardStatusHint,
  type ClientVideoCard,
} from '@/lib/clientBoard'

type Props = {
  batch: AdminBatchFolder
  videos: ClientVideoCard[]
  onOpenVideo: (videoId: string) => void
  onOpenClips?: () => void
}

type ProductionGroup = 'editor' | 'internal' | 'client' | 'scheduling' | 'done'

const GROUP_META: Record<
  ProductionGroup,
  { label: string; shortLabel: string; dot: string; badge: string }
> = {
  editor: {
    label: 'With editor',
    shortLabel: 'Editing',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700',
  },
  internal: {
    label: 'Internal review',
    shortLabel: 'Internal QA',
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700',
  },
  client: {
    label: 'Ready for your review',
    shortLabel: 'Your review',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700',
  },
  scheduling: {
    label: 'Ready to schedule',
    shortLabel: 'Scheduling',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700',
  },
  done: {
    label: 'Completed',
    shortLabel: 'Completed',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
  },
}

const GROUP_ORDER: ProductionGroup[] = [
  'client',
  'editor',
  'internal',
  'scheduling',
  'done',
]

function productionGroup(video: ClientVideoCard): ProductionGroup {
  if (video.owner === 'done') return 'done'
  if (video.owner === 'scheduling') return 'scheduling'
  if (video.owner === 'client' && video.reviewKind) return 'client'
  if (video.owner === 'editor') return 'editor'
  return 'internal'
}

function headline(videos: ClientVideoCard[]) {
  const total = videos.length
  const client = videos.filter((video) => productionGroup(video) === 'client').length
  const done = videos.filter((video) => productionGroup(video) === 'done').length
  const editor = videos.filter((video) => productionGroup(video) === 'editor').length

  if (client > 0) {
    return {
      eyebrow: 'Action required from you',
      title: `${client} ${client === 1 ? 'video is' : 'videos are'} ready for your review`,
      description: 'Review the complete video package and approve it or leave precise feedback.',
      icon: CircleAlert,
      tone: 'action' as const,
    }
  }
  if (done === total && total > 0) {
    return {
      eyebrow: 'Production complete',
      title: `All ${total} videos are complete`,
      description: 'This batch has finished the production workflow.',
      icon: CheckCircle2,
      tone: 'complete' as const,
    }
  }
  if (editor === total && total > 0) {
    return {
      eyebrow: 'Production in progress',
      title: `Your editor is working on ${total} ${total === 1 ? 'video' : 'videos'}`,
      description: 'No action is needed from you. We will notify you when a finished package is ready to review.',
      icon: Film,
      tone: 'working' as const,
    }
  }
  return {
    eyebrow: 'Production in progress',
    title: `${total} ${total === 1 ? 'video is' : 'videos are'} moving through production`,
    description: 'Each video is tracked independently as it moves through editing, internal QA, and your review.',
    icon: Sparkles,
    tone: 'working' as const,
  }
}

export function ClientProductionOverview({
  batch,
  videos,
  onOpenVideo,
  onOpenClips,
}: Props) {
  const summary = headline(videos)
  const SummaryIcon = summary.icon
  const canOpenDeliverables = Boolean(batch.editorDeliverablesDriveUrl?.trim())
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    videos: videos.filter((video) => productionGroup(video) === group),
  })).filter((entry) => entry.videos.length > 0)

  return (
    <div className="space-y-4">
      <section
        className={[
          'relative overflow-hidden rounded-3xl px-5 py-5 text-white shadow-[0_16px_42px_rgba(15,23,42,0.16)] md:px-6 md:py-6',
          summary.tone === 'action' ? 'bg-blue-600' : 'bg-[#0a1222]',
        ].join(' ')}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-50"
          style={{
            background:
              summary.tone === 'complete'
                ? 'radial-gradient(circle at 82% 30%, rgba(52,211,153,0.42), transparent 52%)'
                : 'radial-gradient(circle at 82% 30%, rgba(59,130,246,0.5), transparent 52%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <SummaryIcon className="size-5.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-200">
              {summary.eyebrow}
            </p>
            <h3 className="mt-1.5 text-xl font-bold tracking-[-0.025em] md:text-2xl">
              {summary.title}
            </h3>
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-300">
              {summary.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[270px] lg:justify-end">
            {grouped.map(({ group, videos: groupVideos }) => (
              <span
                key={group}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold text-white"
              >
                <span className={`size-1.5 rounded-full ${GROUP_META[group].dot}`} />
                {groupVideos.length} {GROUP_META[group].shortLabel}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-950">Videos in this batch</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
                {videos.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              A compact view of every clip and where it currently stands.
            </p>
          </div>
          {onOpenClips ? (
            <button
              type="button"
              onClick={onOpenClips}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700 sm:self-auto"
            >
              <FolderOpen className="size-3.5" aria-hidden />
              View source clips
            </button>
          ) : null}
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400 md:grid-cols-[70px_minmax(0,1fr)_170px_130px] md:px-5">
          <span className="hidden md:block">Video</span>
          <span>Title</span>
          <span className="hidden md:block">Current stage</span>
          <span className="text-right">Details</span>
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          {grouped.flatMap(({ group, videos: groupVideos }) =>
            groupVideos.map((video) => {
              const meta = GROUP_META[group]
              const canOpen = canOpenDeliverables || group === 'client' || group === 'done'
              return (
                <div
                  key={video.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 md:grid-cols-[70px_minmax(0,1fr)_170px_130px] md:px-5"
                >
                  <span className="hidden text-[11px] font-bold tabular-nums text-slate-400 md:block">
                    #{String(video.deliverableIndex ?? '—').padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {video.title}
                      </p>
                    </div>
                    <p className="mt-1 pl-4 text-[10px] text-slate-500 md:hidden">
                      {meta.label}
                    </p>
                  </div>
                  <span className="hidden md:block">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </span>
                  <div className="flex justify-end">
                    {canOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenVideo(video.id)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-blue-700 transition-colors hover:bg-blue-50"
                      >
                        {group === 'client' ? (
                          <>
                            <Eye className="size-3.5" aria-hidden />
                            Review
                          </>
                        ) : (
                          <>
                            View
                            <ArrowRight className="size-3" aria-hidden />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                        {group === 'editor' ? (
                          <Clock3 className="size-3" aria-hidden />
                        ) : (
                          <ShieldCheck className="size-3" aria-hidden />
                        )}
                        {group === 'editor'
                          ? 'No action needed'
                          : group === 'internal'
                            ? 'Internal check'
                            : clientCardStatusHint(video)}
                      </span>
                    )}
                  </div>
                </div>
              )
            }),
          )}
        </div>
      </section>
    </div>
  )
}
