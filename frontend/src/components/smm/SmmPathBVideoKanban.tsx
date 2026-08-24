import { ArrowRight, CalendarClock, FolderOpen, Scissors } from 'lucide-react'
import { DeadlineChip } from '@/components/path-b/DeadlineChip'
import type { AdminBatchFolder } from '@/types/pathB'
import {
  batchNeedsSmmFindClips,
  smmBatchKanbanPhase,
  smmCardActionable,
  videoNeedsSmmQa,
  videoNeedsSmmSchedule,
  type SmmPathBVideoCard,
} from '@/lib/smmBoard'

type Props = {
  batch: AdminBatchFolder
  videos: SmmPathBVideoCard[]
  onFindClips: () => void
  onViewClips: () => void
  onOpenVideo: (videoId: string) => void
}

function rowStatus(video: SmmPathBVideoCard) {
  if (video.owner === 'done') return { label: 'Completed', tone: 'bg-emerald-50 text-emerald-700' }
  if (videoNeedsSmmSchedule(video)) return { label: 'Scheduling', tone: 'bg-cyan-50 text-cyan-700' }
  if (videoNeedsSmmQa(video)) return { label: 'Internal QA', tone: 'bg-amber-50 text-amber-700' }
  if (video.owner === 'client') return { label: 'Client review', tone: 'bg-blue-50 text-blue-700' }
  if (video.owner === 'editor') return { label: 'With editor', tone: 'bg-violet-50 text-violet-700' }
  return { label: video.stageLabel, tone: 'bg-slate-100 text-slate-600' }
}

export function SmmPathBVideoKanban({ batch, videos, onFindClips, onViewClips, onOpenVideo }: Props) {
  const phase = smmBatchKanbanPhase(batch)
  const showFindClips = batchNeedsSmmFindClips(batch)
  const showViewClips = phase === 'pre_split' && Boolean(batch.clipsFolderUrl?.trim())

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-950">Videos</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{videos.length}</span>
        </div>
        {showFindClips || showViewClips ? (
          <button type="button" onClick={showFindClips ? onFindClips : onViewClips} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            {showFindClips ? <Scissors className="size-3.5" aria-hidden /> : <FolderOpen className="size-3.5" aria-hidden />}
            {showFindClips ? 'Find clips' : 'View clips'}
          </button>
        ) : null}
      </header>
      <div className="grid grid-cols-[64px_minmax(0,1fr)_150px_120px_90px] border-b border-slate-100 bg-slate-50/80 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">
        <span>Video</span><span>Title</span><span>Stage</span><span>Deadline</span><span className="text-right">Action</span>
      </div>
      <div className="max-h-[min(62vh,620px)] overflow-y-auto">
        {videos.length ? videos.map((video) => {
          const status = rowStatus(video)
          const actionable = smmCardActionable(video, batch)
          const schedule = videoNeedsSmmSchedule(video)
          return (
            <div key={video.id} className="grid grid-cols-[64px_minmax(0,1fr)_150px_120px_90px] items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0">
              <span className="text-[11px] font-bold tabular-nums text-slate-400">#{String(video.deliverableIndex ?? '—').padStart(2, '0')}</span>
              <p className="truncate text-xs font-semibold text-slate-900">{video.editorPublishTitle?.trim() || video.title}</p>
              <span><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${status.tone}`}>{status.label}</span></span>
              <span>{video.deadlineAt ? <DeadlineChip deadlineAt={video.deadlineAt} /> : <span className="text-[10px] text-slate-400">—</span>}</span>
              <div className="flex justify-end">
                {actionable ? (
                  <button type="button" onClick={() => onOpenVideo(video.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50">
                    {schedule ? <CalendarClock className="size-3.5" aria-hidden /> : null}
                    {schedule ? 'Schedule' : 'Open'}
                    {!schedule ? <ArrowRight className="size-3" aria-hidden /> : null}
                  </button>
                ) : <span className="text-[10px] text-slate-400">Waiting</span>}
              </div>
            </div>
          )
        }) : (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No videos in this batch yet.</p>
        )}
      </div>
    </section>
  )
}
