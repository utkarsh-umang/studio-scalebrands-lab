import { FolderPlus } from 'lucide-react'
import { useTheme } from '@/theme'

type Props = {
  onClick: () => void
}

export function CreateBatchFolderCard({ onClick }: Props) {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary

  return (
    <button
      type="button"
      onClick={onClick}
      className="group border-border bg-background/90 hover:border-primary/40 flex h-[168px] w-[220px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-5 text-left backdrop-blur-xl transition-all hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        outlineColor: primary,
        boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
      }}
    >
      <FolderIconBadge primary={primary} secondary={secondary} />
      <div className="space-y-1 text-center">
        <p className="text-foreground text-sm font-semibold">New batch folder</p>
        <p className="text-muted-foreground text-xs leading-snug">
          Create an epic for raw-footage work
        </p>
      </div>
    </button>
  )
}

function FolderIconBadge({
  primary,
  secondary,
}: {
  primary: string
  secondary: string
}) {
  return (
    <div
      className="flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${primary}18, ${secondary}22)`,
        border: `1px solid ${primary}35`,
      }}
    >
      <FolderPlus className="size-6" style={{ color: primary }} aria-hidden />
    </div>
  )
}
