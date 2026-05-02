import { ChevronRight, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/theme'
import { MOCK_CLIENT_TEXT_BATCH_INDEX } from '@mockData/index'
import { ClientPageHeader, formatDate } from './clientPageUtils'

export function ClientThumbnailsList() {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  return (
    <>
      <ClientPageHeader
        title="Thumbnails & titles"
        subtitle="Approve thumbnail text and video title before the editor builds assets."
      />

      <div
        className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        {MOCK_CLIENT_TEXT_BATCH_INDEX.length === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">
            No copy reviews at the moment.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {MOCK_CLIENT_TEXT_BATCH_INDEX.map((row) => (
              <li key={row.id}>
                <Link
                  to={`/client/thumbnails/${row.id}`}
                  className="hover:bg-muted/40 flex items-center gap-3 px-5 py-4 transition-colors"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${primary}12` }}
                  >
                    <Tag className="size-4 text-foreground/80" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-xs">{row.subtitle}</p>
                  </div>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatDate(row.updatedAt)}
                  </span>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
