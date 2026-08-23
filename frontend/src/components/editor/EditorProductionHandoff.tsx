import { ArrowRight, CheckCircle2, Film, FolderOpen, UploadCloud } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import type { EditorPathBVideoCard } from '@/lib/editorBoard'

type Props = {
  batch: AdminBatchFolder
  videos: EditorPathBVideoCard[]
  onOpenWorkspace: () => void
}

export function EditorProductionHandoff({
  batch,
  videos,
  onOpenWorkspace,
}: Props) {
  const expectedCount = Math.max(batch.videoCount, videos.length)

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl bg-blue-600 px-5 py-5 text-white shadow-[0_18px_46px_rgba(37,99,235,0.22)] md:px-6 md:py-6">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 82% 30%, rgba(147,197,253,0.55), transparent 54%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
            <UploadCloud className="size-5.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-100">
              Ready for production
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-[-0.025em] md:text-2xl">
              {expectedCount} source {expectedCount === 1 ? 'clip is' : 'clips are'} ready for you
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-blue-100">
              Produce one finished video for every source clip. When the batch is complete,
              upload each finished file directly to Studio. Every upload is stored privately
              and versioned automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-blue-700 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Open production workspace
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-700">
            <Film className="size-4" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-[0.13em]">
              Expected output
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {expectedCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">One video per source clip</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <FolderOpen className="size-4" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-[0.13em]">
              Source access
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-950">Stored in Studio</p>
          <p className="mt-1 text-[11px] text-slate-500">Private source previews are ready</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700">
            <CheckCircle2 className="size-4" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-[0.13em]">
              Next checkpoint
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-950">Upload finished files</p>
          <p className="mt-1 text-[11px] text-slate-600">One private, versioned upload per video</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-950">Production checklist</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
                {expectedCount}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Every source clip must have one matching finished video.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700 sm:self-auto"
          >
            <FolderOpen className="size-3.5" aria-hidden />
            View source clips
          </button>
        </header>
        <div className="grid grid-cols-[68px_minmax(0,1fr)_150px] border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400 md:px-5">
          <span>Clip</span>
          <span>Source</span>
          <span className="text-right">Status</span>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {videos.map((video) => (
            <div
              key={video.id}
              className="grid grid-cols-[68px_minmax(0,1fr)_150px] items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 md:px-5"
            >
              <span className="text-[11px] font-bold tabular-nums text-slate-400">
                #{String(video.deliverableIndex ?? '—').padStart(2, '0')}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                <p className="truncate text-xs font-semibold text-slate-900">{video.title}</p>
              </div>
              <span className="text-right text-[10px] font-semibold text-slate-500">
                Awaiting final video
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
