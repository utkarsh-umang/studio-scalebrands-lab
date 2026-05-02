import { useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { useTheme } from '@/theme'
import {
  MOCK_ADMIN_DEADLINE_TASKS,
  type AdminDeadlineTask,
} from '@mockData/index'
import { ClientPageHeader, formatDateTime } from '@/pages/client/clientPageUtils'

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

export function AdminDeadlines() {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const [tasks, setTasks] = useState<AdminDeadlineTask[]>(() => [
    ...MOCK_ADMIN_DEADLINE_TASKS,
  ])

  const withoutDeadline = useMemo(
    () => tasks.filter((t) => t.dueAt == null).length,
    [tasks],
  )

  return (
    <>
      <ClientPageHeader
        title="Deadlines"
        subtitle="Assign or adjust due dates on tasks owned by Social Media Managers and Editors."
      />

      <div
        className="border-border bg-background/85 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        <CalendarClock className="size-5 shrink-0" style={{ color: primary }} aria-hidden />
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground font-semibold">
            {withoutDeadline}
          </strong>{' '}
          task{withoutDeadline === 1 ? '' : 's'} without a deadline — consider
          setting one for planning.
        </p>
      </div>

      <div
        className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-border bg-muted/30 border-b text-xs uppercase tracking-wide">
                <th className="text-muted-foreground px-5 py-3 font-semibold">
                  Task
                </th>
                <th className="text-muted-foreground px-5 py-3 font-semibold">
                  Client
                </th>
                <th className="text-muted-foreground px-5 py-3 font-semibold">
                  Owner
                </th>
                <th className="text-muted-foreground px-5 py-3 font-semibold">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {tasks.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 align-top">
                  <td className="px-5 py-4">
                    <p className="text-foreground font-medium">{row.taskLabel}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.batchTitle}{' '}
                      <span className="font-mono text-[10px] opacity-80">
                        {row.batchId}
                      </span>
                    </p>
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-xs">
                    {row.clientLabel}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        background:
                          row.assigneeRole === 'smm'
                            ? `${primary}14`
                            : `${theme.colors.secondary}14`,
                        color:
                          row.assigneeRole === 'smm'
                            ? primary
                            : theme.colors.secondary,
                        border: `1px solid ${
                          row.assigneeRole === 'smm'
                            ? `${primary}35`
                            : `${theme.colors.secondary}35`
                        }`,
                      }}
                    >
                      {row.assigneeRole === 'smm' ? 'SMM' : 'Editor'}
                    </span>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {row.assigneeName}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <label className="block space-y-1">
                      <span className="sr-only">Deadline</span>
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalValue(row.dueAt)}
                        onChange={(ev) => {
                          const next = fromDatetimeLocalValue(ev.target.value)
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === row.id
                                ? {
                                    ...t,
                                    dueAt: next,
                                    updatedAt: new Date()
                                      .toISOString()
                                      .slice(0, 10),
                                  }
                                : t,
                            ),
                          )
                        }}
                        className="border-border bg-background focus:ring-primary/25 max-w-[220px] rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2"
                      />
                    </label>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {row.dueAt
                        ? `Shown: ${formatDateTime(row.dueAt)}`
                        : 'No date — pick one to commit'}
                    </p>
                    {row.dueAt && (
                      <button
                        type="button"
                        onClick={() => {
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === row.id
                                ? {
                                    ...t,
                                    dueAt: null,
                                    updatedAt: new Date()
                                      .toISOString()
                                      .slice(0, 10),
                                  }
                                : t,
                            ),
                          )
                        }}
                        className="text-muted-foreground hover:text-foreground mt-2 text-[10px] font-medium underline-offset-2 hover:underline"
                      >
                        Clear deadline
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
