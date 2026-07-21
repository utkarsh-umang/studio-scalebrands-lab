import { Scissors, Image, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type OwnerKind = 'smm' | 'editor' | 'client' | null

/** Selectable owners, in the order they appear as toggles. */
const OWNER_KINDS = ['smm', 'editor', 'client'] as const

export type BatchOwnership = {
  clipOwnerKind: OwnerKind
  thumbnailOwnerKind: OwnerKind
  titleOwnerKind: OwnerKind
}

type Props = BatchOwnership & {
  smmName?: string
  editorName?: string
  /** Shown on the client toggle — clients who supply their own thumbnails/titles. */
  clientName?: string
  /** When provided, renders interactive owner toggles (admin). Else read-only. */
  onChange?: (next: BatchOwnership) => void
  className?: string
}

type Row = { key: keyof BatchOwnership; label: string; Icon: LucideIcon }

const ROWS: Row[] = [
  { key: 'clipOwnerKind', label: 'Clip ID', Icon: Scissors },
  { key: 'thumbnailOwnerKind', label: 'Thumbnail', Icon: Image },
  { key: 'titleOwnerKind', label: 'Title', Icon: Type },
]

function ownerLabel(
  kind: OwnerKind,
  smmName?: string,
  editorName?: string,
  clientName?: string,
): string {
  if (kind === 'smm') return smmName ?? 'SMM'
  if (kind === 'editor') return editorName ?? 'Editor'
  if (kind === 'client') return clientName ?? 'Client'
  return 'Unassigned'
}

export function BatchOwnershipControls({
  clipOwnerKind,
  thumbnailOwnerKind,
  titleOwnerKind,
  smmName,
  editorName,
  clientName,
  onChange,
  className = '',
}: Props) {
  const current: BatchOwnership = { clipOwnerKind, thumbnailOwnerKind, titleOwnerKind }

  if (!onChange) {
    // Read-only strip (boards)
    return (
      <div className={`text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] ${className}`}>
        {ROWS.map(({ key, label, Icon }) => (
          <span key={key} className="inline-flex items-center gap-1">
            <Icon className="size-3 opacity-70" aria-hidden />
            {label}:{' '}
            <span className={current[key] ? 'text-foreground font-medium' : 'italic'}>
              {ownerLabel(current[key], smmName, editorName, clientName)}
            </span>
          </span>
        ))}
      </div>
    )
  }

  const set = (key: keyof BatchOwnership, value: OwnerKind) => {
    const next: BatchOwnership = { ...current, [key]: current[key] === value ? null : value }
    onChange(next)
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {ROWS.map(({ key, label, Icon }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-muted-foreground inline-flex w-20 shrink-0 items-center gap-1 text-xs">
            <Icon className="size-3.5 opacity-70" aria-hidden />
            {label}
          </span>
          {OWNER_KINDS.map((kind) => {
            const active = current[key] === kind
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  set(key, kind)
                }}
                className={[
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {ownerLabel(kind, smmName, editorName, clientName)}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
