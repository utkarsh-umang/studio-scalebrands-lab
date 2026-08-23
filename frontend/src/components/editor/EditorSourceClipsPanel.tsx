import { useMemo, useState } from 'react'
import { CheckCircle2, FileVideo2, ShieldCheck } from 'lucide-react'
import type { AdminVideoTicket } from '@/types/pathB'
import { StudioMediaPreview } from '@/components/media/StudioMediaPreview'
import { studioMediaSlot } from '@/lib/studioMedia'

type Props = {
  tickets: AdminVideoTicket[]
}

export function EditorSourceClipsPanel({ tickets }: Props) {
  const sourceTickets = useMemo(
    () =>
      tickets
        .filter(
          (ticket) =>
            ticket.deliverableIndex != null &&
            ticket.deliverableIndex > 0 &&
            studioMediaSlot(ticket, 'source_clip'),
        )
        .sort(
          (a, b) => (a.deliverableIndex ?? 0) - (b.deliverableIndex ?? 0),
        ),
    [tickets],
  )
  const [selectedTicketId, setSelectedTicketId] = useState(
    sourceTickets[0]?.id ?? '',
  )
  const selectedTicket =
    sourceTickets.find((ticket) => ticket.id === selectedTicketId) ??
    sourceTickets[0]
  const selectedSource = studioMediaSlot(selectedTicket, 'source_clip')

  if (!selectedTicket || !selectedSource) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        No source clips are attached to these production items yet.
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-950">Source clips</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Select a clip, review the client&apos;s original, then upload the matching
            finished cut below.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
          <ShieldCheck className="size-3.5" aria-hidden />
          Private Studio storage
        </span>
      </header>

      <div className="flex min-h-0 flex-col gap-4 bg-slate-50/65 p-3 md:p-4 lg:flex-row lg:items-start">
        <aside
          className="flex h-[220px] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:h-[440px] lg:w-64"
          aria-label="Source clip list"
        >
          <div className="shrink-0 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-900">Batch clips</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {sourceTickets.length} total
              </span>
            </div>
          </div>
          <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-y-contain p-2.5">
            {sourceTickets.map((ticket) => {
              const active = ticket.id === selectedTicket.id
              const source = studioMediaSlot(ticket, 'source_clip')
              const finished = studioMediaSlot(ticket, 'video')
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition-all',
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-950 shadow-sm'
                        : 'border-transparent bg-slate-50/80 text-slate-700 hover:border-slate-200 hover:bg-white',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tabular-nums',
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-500 ring-1 ring-slate-200',
                      ].join(' ')}
                    >
                      {ticket.deliverableIndex}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">
                        {ticket.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                        {source?.name}
                      </span>
                    </span>
                    {finished ? (
                      <CheckCircle2
                        className="size-3.5 shrink-0 text-emerald-600"
                        aria-label="Finished video uploaded"
                      />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                Source clip {selectedTicket.deliverableIndex}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {selectedSource.name}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              <FileVideo2 className="size-3" aria-hidden />
              Original upload
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-slate-950 p-2 shadow-inner md:p-3">
            <StudioMediaPreview
              assetId={selectedSource.assetId}
              fileName={selectedSource.name}
              kind="video"
              layout="landscape"
            />
          </div>
        </main>
      </div>
    </section>
  )
}
