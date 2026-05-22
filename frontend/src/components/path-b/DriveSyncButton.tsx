import { RefreshCw } from 'lucide-react'

type Props = {
  onSync: () => void
  syncing?: boolean
  disabled?: boolean
  label?: string
  className?: string
}

export function DriveSyncButton({
  onSync,
  syncing = false,
  disabled = false,
  label = 'Sync from Drive',
  className = '',
}: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        onSync()
      }}
      disabled={disabled || syncing}
      className={[
        'border-border bg-muted/30 hover:border-primary/35 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:opacity-60',
        className,
      ].join(' ')}
    >
      <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden />
      {label}
    </button>
  )
}
