import { useCallback, useEffect, useState } from 'react'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import { getManifestForBatch, reloadDriveManifestForBatch } from '@/lib/driveMedia'

/**
 * Local manifest override after Sync — falls back to bundled `DRIVE_MANIFESTS`.
 */
export function useDriveManifestSync(batchId: string, resetKey?: string | number) {
  const [override, setOverride] = useState<BatchDriveManifest | undefined>()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOverride(undefined)
    setError(null)
    setSyncing(false)
  }, [batchId, resetKey])

  const manifest = override ?? getManifestForBatch(batchId)

  const sync = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const next = await reloadDriveManifestForBatch(batchId)
      if (next) {
        setOverride(next)
      } else {
        setError('No manifest for this batch yet.')
      }
    } catch {
      setError('Could not reload manifest — try a full page refresh.')
    } finally {
      setSyncing(false)
    }
  }, [batchId])

  return { manifest, syncing, error, sync, setOverride }
}
