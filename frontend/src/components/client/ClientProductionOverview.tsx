import { ArrowRight, Eye, FolderOpen, ImagePlus, Plus } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import type { ClientVideoCard } from '@/lib/clientBoard'
import { studioMediaSlot } from '@/lib/studioMedia'

type Props = {
  batch: AdminBatchFolder
  videos: ClientVideoCard[]
  onOpenVideo: (videoId: string) => void
  onOpenClips?: () => void
  onAddVideos: () => void
  onAddThumbnail: (videoId: string) => void
}

type ProductionGroup = 'editor' | 'internal' | 'client' | 'scheduling' | 'done'

const GROUP_META: Record<ProductionGroup, { label: string; dot: string; badge: string }> = {
  editor: { label: 'With editor', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
  internal: { label: 'Internal QA', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
  client: { label: 'Your review', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  scheduling: { label: 'Scheduling', dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700' },
  done: { label: 'Completed', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
}

function productionGroup(video: ClientVideoCard): ProductionGroup {
  if (video.owner === 'done') return 'done'
  if (video.owner === 'scheduling') return 'scheduling'
  if (video.owner === 'client' && video.reviewKind) return 'client'
  if (video.owner === 'editor') return 'editor'
  return 'internal'
}

export function ClientProductionOverview({
  batch,
  videos,
  onOpenVideo,
  onOpenClips,
  onAddVideos,
  onAddThumbnail,
}: Props) {
  const clientOwnsThumbnails = batch.thumbnailOwnerKind === 'client'

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-950">Videos</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">{videos.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenClips ? (
            <button type="button" onClick={onOpenClips} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <FolderOpen className="size-3.5" aria-hidden /> Source clips
            </button>
          ) : null}
          <button type="button" onClick={onAddVideos} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            <Plus className="size-3.5" aria-hidden /> Add videos
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400 md:grid-cols-[64px_minmax(0,1fr)_150px_130px_92px] md:px-5">
        <span className="hidden md:block">Video</span>
        <span>Title</span>
        <span className="hidden md:block">Stage</span>
        <span className="hidden md:block">Thumbnail</span>
        <span className="text-right">Open</span>
      </div>

      <div className="max-h-[min(54vh,520px)] overflow-y-auto">
        {videos.map((video) => {
          const group = productionGroup(video)
          const meta = GROUP_META[group]
          const thumbnail = studioMediaSlot(video, 'thumbnail')
          const canOpen = Boolean(studioMediaSlot(video, 'video')) || group === 'client' || group === 'done'
          return (
            <div key={video.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-[64px_minmax(0,1fr)_150px_130px_92px] md:px-5">
              <span className="hidden text-[11px] font-bold tabular-nums text-slate-400 md:block">#{String(video.deliverableIndex ?? '—').padStart(2, '0')}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
                  <p className="truncate text-xs font-semibold text-slate-900">{video.editorPublishTitle?.trim() || video.title}</p>
                </div>
                <p className="mt-1 pl-4 text-[10px] text-slate-500 md:hidden">{meta.label}</p>
              </div>
              <span className="hidden md:block">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${meta.badge}`}>{meta.label}</span>
              </span>
              <span className="hidden md:block">
                {clientOwnsThumbnails ? (
                  <button type="button" onClick={() => onAddThumbnail(video.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                    <ImagePlus className="size-3.5" aria-hidden /> {thumbnail ? 'Replace' : 'Add'}
                  </button>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">{thumbnail ? 'Ready' : 'With team'}</span>
                )}
              </span>
              <div className="flex justify-end">
                {canOpen ? (
                  <button type="button" onClick={() => onOpenVideo(video.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50">
                    {group === 'client' ? <Eye className="size-3.5" aria-hidden /> : null}
                    {group === 'client' ? 'Review' : 'View'}
                    {group !== 'client' ? <ArrowRight className="size-3" aria-hidden /> : null}
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400">In progress</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
