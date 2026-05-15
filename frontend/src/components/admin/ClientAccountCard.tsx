import { ChevronRight, Film, FolderOpen, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import type { AdminClientProfile } from '@mockData/index'

type Props = {
  client: AdminClientProfile
  activeBatchCount: number
  activeVideoCount: number
}

export function ClientAccountCard({
  client,
  activeBatchCount,
  activeVideoCount,
}: Props) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const primary = theme.colors.primary
  const ink = theme.colors.foreground

  return (
    <button
      type="button"
      onClick={() => {
        navigate(`/admin/clients/${client.id}`)
      }}
      className="border-border bg-background/90 hover:border-primary/35 group flex h-[168px] w-[220px] shrink-0 flex-col rounded-2xl border p-4 text-left backdrop-blur-xl transition-all hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        outlineColor: primary,
        boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
      }}
    >
      <ClientCardTopRow client={client} primary={primary} />
      <div className="mt-3 min-w-0 flex-1">
        <p
          className="font-[family-name:var(--heading)] truncate text-base font-bold"
          style={{ color: ink }}
        >
          {client.displayName}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-[10px]">
          {client.loginId}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <div className="text-muted-foreground flex flex-wrap gap-2 text-[10px]">
          <span className="inline-flex items-center gap-1">
            <FolderOpen className="size-3 opacity-70" aria-hidden />
            {activeBatchCount} active
          </span>
          <span className="inline-flex items-center gap-1">
            <Film className="size-3 opacity-70" aria-hidden />
            {activeVideoCount} videos
          </span>
        </div>
        <ChevronRight
          className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>
    </button>
  )
}

function ClientCardTopRow({
  client,
  primary,
}: {
  client: AdminClientProfile
  primary: string
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${primary}14`, border: `1px solid ${primary}30` }}
      >
        <User className="size-5" style={{ color: primary }} aria-hidden />
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
        style={{
          background: `${primary}10`,
          color: primary,
          border: `1px solid ${primary}28`,
        }}
      >
        {client.credits} cr
      </span>
    </div>
  )
}
