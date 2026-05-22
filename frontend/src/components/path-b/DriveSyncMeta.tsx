import type { BatchDriveManifest } from '@/lib/driveMedia'
import { formatSyncedAt } from '@/lib/driveMedia'

type Props = {
  manifest: BatchDriveManifest | undefined
  errorMessage?: string | null
}

export function DriveSyncMeta({ manifest, errorMessage }: Props) {
  if (errorMessage) {
    return <span className="text-destructive">{errorMessage}</span>
  }

  if (!manifest) {
    return <>No Drive manifest loaded.</>
  }

  return (
    <>
      Last synced {formatSyncedAt(manifest.syncedAt)}
      {manifest.unmapped.length > 0 ? (
        <span className="text-destructive">
          {' '}
          · {manifest.unmapped.length} unmapped file(s)
        </span>
      ) : null}
    </>
  )
}
