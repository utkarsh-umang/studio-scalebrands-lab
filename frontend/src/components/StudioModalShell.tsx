import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  onClose: () => void
  titleId?: string
  /** e.g. primary external link shown next to the close control */
  headerAside?: ReactNode
  /** Second line under subtitle (e.g. last synced from Drive) */
  headerMeta?: ReactNode
  children: ReactNode
  /** Optional footer bar (e.g. primary action) pinned under the scrollable body */
  footer?: ReactNode
}

export function StudioModalShell({
  title,
  subtitle,
  onClose,
  titleId = 'studio-modal-title',
  headerAside,
  headerMeta,
  children,
  footer,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50"
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
      <div className="pointer-events-none fixed inset-0 flex items-start justify-center overflow-y-auto overscroll-contain p-3 py-10 sm:items-center sm:p-4 sm:py-10">
        <div
          className="border-border bg-background pointer-events-auto relative z-[1] flex max-h-[min(92vh,960px)] min-h-0 w-[min(96vw,1280px)] shrink-0 flex-col overflow-hidden rounded-2xl border shadow-2xl"
          style={{ boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.55) inset' }}
        >
        <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1 pr-2">
            <h2 id={titleId} className="text-foreground font-semibold">
              {title}
            </h2>
            <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
            {headerMeta ? (
              <p className="text-muted-foreground mt-1 text-[11px] leading-snug md:text-xs">
                {headerMeta}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerAside}
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-5">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
            {children}
          </div>
          {footer ? (
            <div className="border-border mt-4 shrink-0 border-t pt-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  </div>
  )
}
