import { useCallback, useEffect, useRef, useState } from 'react'
import { DriveService } from '@/client'
import type { BatchDriveManifestResponse, DriveDiagnosticsDto } from '@/client'
import type { BatchDriveManifest } from '@/lib/driveMedia'
import { getManifestForBatch } from '@/lib/driveMedia'

/**
 * Live Drive manifest for a batch. Fetches from the backend (service account)
 * on open and on Sync, so a pasted Drive folder actually loads its files. Falls
 * back to the bundled `DRIVE_MANIFESTS` for offline demo batches.
 */

/** Manifest plus the backend's access diagnostics (why files did / didn't load). */
export type ManifestWithDiagnostics = BatchDriveManifest & {
  diagnostics?: DriveDiagnosticsDto | null
}

function toManifest(res: BatchDriveManifestResponse): ManifestWithDiagnostics {
  return {
    batchId: res.batchId,
    syncedAt: res.syncedAt,
    clips: res.clips ?? [],
    videos: res.videos ?? [],
    thumbnails: res.thumbnails ?? [],
    unmapped: res.unmapped ?? [],
    diagnostics: res.diagnostics ?? null,
  }
}

async function fetchManifest(batchId: string): Promise<ManifestWithDiagnostics> {
  const res = await DriveService.getBatchDriveManifestApiV1DriveBatchesBatchIdManifestGet(batchId)
  return toManifest(res)
}

export function useDriveManifestSync(batchId: string, resetKey?: string | number) {
  const [override, setOverride] = useState<ManifestWithDiagnostics | undefined>()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)

  // Auto-fetch live manifest on open / batch change. Falls back silently to the
  // bundled manifest so demo batches still render without a backend round-trip.
  useEffect(() => {
    const req = ++reqRef.current
    setOverride(undefined)
    setError(null)
    setSyncing(true)
    fetchManifest(batchId)
      .then((next) => {
        if (reqRef.current !== req) return
        setOverride(next)
      })
      .catch(() => {
        if (reqRef.current !== req) return
        // Quiet fallback on open — only explicit Sync surfaces an error.
      })
      .finally(() => {
        if (reqRef.current === req) setSyncing(false)
      })
  }, [batchId, resetKey])

  const manifest: ManifestWithDiagnostics | undefined =
    override ?? getManifestForBatch(batchId)

  const sync = useCallback(async (): Promise<ManifestWithDiagnostics | undefined> => {
    const req = ++reqRef.current
    setSyncing(true)
    setError(null)
    try {
      const next = await fetchManifest(batchId)
      if (reqRef.current === req) setOverride(next)
      return next
    } catch (err) {
      if (reqRef.current === req) {
        const message =
          (err as { body?: { detail?: { message?: string } } })?.body?.detail?.message ??
          'Could not load files from Drive. Check the folder is shared with the service account.'
        setError(message)
      }
      return undefined
    } finally {
      if (reqRef.current === req) setSyncing(false)
    }
  }, [batchId])

  return { manifest, syncing, error, sync, setOverride }
}
