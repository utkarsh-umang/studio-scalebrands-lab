import { ExternalLink, AlertTriangle } from 'lucide-react'
import { formatSyncedAt, getManifestForBatch } from '@/lib/driveMedia'

type Props = {
  batchId: string
  folderUrl: string
  folderLabel?: string
  children: React.ReactNode
}

export function DriveFolderReviewShell({
  batchId,
  folderUrl,
  folderLabel = 'Open folder on Drive',
  children,
}: Props) {
  const manifest = getManifestForBatch(batchId)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-border mb-4 shrink-0 space-y-2 border-b pb-4">
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-muted/30 hover:border-primary/35 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          {folderLabel}
        </a>
        {manifest ? (
          <p className="text-muted-foreground text-center text-xs">
            Manifest synced {formatSyncedAt(manifest.syncedAt)}
            {manifest.unmapped.length > 0 && (
              <span className="text-destructive">
                {' '}
                · {manifest.unmapped.length} unmapped file(s)
              </span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-center text-xs">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            No Drive manifest — run{' '}
            <code className="font-mono">npm run drive:sync-manifests</code>
          </p>
        )}
        {manifest && manifest.unmapped.length > 0 && (
          <ul className="text-destructive/90 max-h-24 overflow-y-auto text-left text-[11px]">
            {manifest.unmapped.map((u) => (
              <li key={`${u.name}-${u.reason}`}>
                <span className="font-medium">{u.name}</span>: {u.reason}
              </li>
            ))}
          </ul>
        )}
      </header>
      {children}
    </div>
  )
}
