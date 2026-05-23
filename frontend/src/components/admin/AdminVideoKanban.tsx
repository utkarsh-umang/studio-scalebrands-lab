import { ADMIN_KANBAN_COLUMNS } from '@/lib/adminKanbanColumns'
import type { AdminVideoTicket } from '@/types/pathB'
import { formatDateTime } from '@/pages/client/clientPageUtils'

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(local: string): string | null {
  if (!local.trim()) return null
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

type Props = {
  tickets: AdminVideoTicket[]
  onDeadlineChange: (videoId: string, deadlineAt: string | null) => void
}

export function AdminVideoKanban({ tickets, onDeadlineChange }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {ADMIN_KANBAN_COLUMNS.map((col) => {
        const columnTickets = tickets.filter((t) => t.owner === col.owner)
        return (
          <div
            key={col.owner}
            className="bg-muted/25 border-border flex w-[220px] shrink-0 flex-col rounded-xl border"
          >
            <div className="border-border flex items-center justify-between border-b px-3 py-2.5">
              <span className="text-foreground text-xs font-semibold">
                {col.label}
              </span>
              <span className="text-muted-foreground text-[10px] tabular-nums">
                {columnTickets.length}
              </span>
            </div>
            <ul className="flex min-h-[120px] flex-col gap-2 p-2">
              {columnTickets.length === 0 ? (
                <li className="text-muted-foreground px-1 py-4 text-center text-[11px]">
                  —
                </li>
              ) : (
                columnTickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="border-border bg-background rounded-lg border p-2.5 shadow-sm"
                  >
                    <p className="text-foreground text-xs font-medium leading-snug">
                      {ticket.title}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {ticket.stageLabel}
                    </p>
                    {(ticket.deadlineRole === 'smm' ||
                      ticket.deadlineRole === 'editor') && (
                      <label className="mt-2 block space-y-1">
                        <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                          {ticket.deadlineRole === 'smm' ? 'SMM' : 'Editor'}{' '}
                          deadline
                        </span>
                        <input
                          type="datetime-local"
                          value={toDatetimeLocalValue(ticket.deadlineAt)}
                          onChange={(ev) => {
                            onDeadlineChange(
                              ticket.id,
                              fromDatetimeLocalValue(ev.target.value),
                            )
                          }}
                          className="border-border bg-background focus:ring-primary/25 w-full rounded-md border px-1.5 py-1 text-[10px] outline-none focus:ring-2"
                        />
                        {ticket.deadlineAt && (
                          <p className="text-muted-foreground text-[9px]">
                            {formatDateTime(ticket.deadlineAt)}
                          </p>
                        )}
                      </label>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
