import type { DriveMediaEntry } from '@mockData/driveManifests'

type Props = {
  entries: DriveMediaEntry[]
  selectedIndex: number
  onSelect: (index: number) => void
  label?: string
}

export function DriveMediaPicker({
  entries,
  selectedIndex,
  onSelect,
  label = 'Clip',
}: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        No numbered media found in manifest.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-1.5 pb-4">
      {entries.map((e) => {
        const active = e.index === selectedIndex
        return (
          <button
            key={e.driveFileId}
            type="button"
            onClick={() => {
              onSelect(e.index)
            }}
            className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'border-border bg-muted/40 text-foreground hover:bg-muted/70 border'
            }`}
            title={e.name}
          >
            {label} {e.index}
          </button>
        )
      })}
    </div>
  )
}
