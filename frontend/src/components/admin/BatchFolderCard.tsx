import { Film, Folder } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { formatDate } from '@/pages/client/clientPageUtils'
import type { AdminBatchFolder } from '@mockData/index'

type Props = {
  batch: AdminBatchFolder
  clientId: string
}

export function BatchFolderCard({ batch, clientId }: Props) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const primary = theme.colors.primary
  const isActive = batch.status === 'active'

  return (
    <button
      type="button"
      onClick={() => {
        navigate(`/admin/clients/${clientId}/batches/${batch.id}`)
      }}
      className="border-border bg-background/90 hover:border-primary/35 group flex w-full flex-col rounded-xl border p-4 text-left backdrop-blur-xl transition-all hover:shadow-sm"
      style={{
        boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        opacity: isActive ? 1 : 0.85,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: isActive ? `${primary}14` : 'var(--muted)',
            border: isActive ? `1px solid ${primary}30` : '1px solid var(--border)',
          }}
        >
          <Folder
            className="size-4"
            style={{ color: isActive ? primary : undefined }}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate font-medium">{batch.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Updated {formatDate(batch.updatedAt)}
          </p>
        </div>
        {!isActive && (
          <span className="text-muted-foreground shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Done
          </span>
        )}
      </div>
      <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <Film className="size-3.5 opacity-70" aria-hidden />
          {batch.videoCount} video{batch.videoCount === 1 ? '' : 's'}
        </span>
        {batch.footageUrl && (
          <span className="truncate opacity-80">Footage linked</span>
        )}
      </div>
    </button>
  )
}
