import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  onClose: () => void
  titleId?: string
  children: ReactNode
}

export function StudioModalShell({
  title,
  subtitle,
  onClose,
  titleId = 'studio-modal-title',
  children,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="border-border bg-background relative flex h-[min(92vh,960px)] w-[min(96vw,1280px)] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{ boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.55) inset' }}
      >
        <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2 id={titleId} className="text-foreground font-semibold">
              {title}
            </h2>
            <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  )
}
