/**
 * Shared sidebar used in all multi-deliverable review and handoff screens
 * (clips QA, video QA, thumbnail QA, SMM titles handoff).
 *
 * Callers are responsible for building the row data; this component only
 * handles the selection UI.
 */

export type DeliverableSidebarRow = {
  /** Deliverable index (1-based) — shown as "Video {index}" */
  index: number
  /** Primary label: file name or publish title */
  label: string
  /** Optional second line: stage / status copy */
  statusText?: string
  /** When true, renders a ring-1 highlight to signal "needs your attention" */
  highlighted?: boolean
}

type Props = {
  rows: DeliverableSidebarRow[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  /**
   * Optional heading above the list.
   * - `bordered`: heading separated by a border-b line (SMM-style).
   * - `flat` (default): heading as a plain label above the list (client-style).
   */
  heading?: string
  variant?: 'bordered' | 'flat'
}

export function DeliverableSidebarList({
  rows,
  selectedIndex,
  onSelect,
  heading,
  variant = 'flat',
}: Props) {
  const isBordered = variant === 'bordered'

  return (
    <aside
      className={[
        'border-border bg-muted/15 flex max-h-[min(32vh,260px)] shrink-0 flex-col rounded-xl border',
        isBordered
          ? 'md:max-h-none md:w-56'
          : 'pt-2 md:max-h-none md:w-56 md:bg-transparent md:pt-0',
      ].join(' ')}
    >
      {heading ? (
        <p
          className={[
            'text-muted-foreground shrink-0 text-[10px] font-semibold uppercase tracking-wide',
            isBordered
              ? 'border-border border-b px-2 py-2 md:px-3'
              : 'px-2 pb-2',
          ].join(' ')}
        >
          {heading}
        </p>
      ) : null}
      <ul
        className={[
          'min-h-0 flex-1 space-y-1 overflow-y-auto p-2',
          isBordered ? 'md:px-3 md:pb-3' : 'md:px-0 md:pb-0',
        ].join(' ')}
      >
        {rows.map((row) => {
          const active = row.index === selectedIndex
          return (
            <li key={row.index}>
              <button
                type="button"
                onClick={() => {
                  onSelect(row.index)
                }}
                className={[
                  'flex w-full flex-col rounded-lg px-2 py-2 text-left text-xs transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : row.highlighted
                      ? 'bg-muted/40 hover:bg-muted/55 ring-primary/25 text-foreground ring-1'
                      : 'bg-muted/25 hover:bg-muted/45 text-foreground',
                ].join(' ')}
              >
                <span className="font-semibold tabular-nums">Video {row.index}</span>
                {row.label ? (
                  <span
                    className={[
                      'mt-0.5 line-clamp-2 font-normal opacity-90',
                      active ? 'text-primary-foreground/85' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {row.label}
                  </span>
                ) : null}
                {row.statusText ? (
                  <span
                    className={[
                      'mt-1 text-[10px] font-medium uppercase tracking-wide',
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {row.statusText}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
