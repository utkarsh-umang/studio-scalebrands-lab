import { Calendar, Clock, Link2 } from 'lucide-react'
import { ClientPageHeader, formatDateTime } from './clientPageUtils'
import { MOCK_CLIENT_DASHBOARD } from '@mockData/index'

export function ClientOurWork() {
  const { scheduled } = MOCK_CLIENT_DASHBOARD

  return (
    <>
      <ClientPageHeader
        title="Our work"
        subtitle="Scheduled deliverables — read-only. Links appear when published."
      />

      <div
        className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        {scheduled.length === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">
            No scheduled videos yet.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {scheduled.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-3">
                  <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Calendar className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-xs">{row.platform}</p>
                  </div>
                </div>
                <div className="text-muted-foreground flex flex-col items-start gap-1 text-xs sm:items-end">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="size-3.5" aria-hidden />
                    {formatDateTime(row.goLiveAt)}
                  </span>
                  {row.link ? (
                    <a
                      href={row.link}
                      className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Link2 className="size-3.5" aria-hidden />
                      Open link
                    </a>
                  ) : (
                    <span className="text-[11px]">Link TBD</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
