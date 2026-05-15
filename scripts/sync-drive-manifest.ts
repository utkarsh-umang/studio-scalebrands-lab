/**
 * Lists numbered media from Google Drive folders (service account) and writes
 * frontend/mockData/driveManifests.ts — run: npm run drive:sync-manifests
 */
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'
import { DRIVE_MANIFEST_BATCH_CONFIG } from './drive-manifest-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

config({ path: path.join(repoRoot, '.env') })

export type DriveMediaEntry = {
  index: number
  driveFileId: string
  name: string
  mimeType: string
  modifiedTime: string
}

export type DriveUnmappedEntry = {
  name: string
  reason: string
}

export type BatchDriveManifest = {
  batchId: string
  syncedAt: string
  clips: DriveMediaEntry[]
  videos: DriveMediaEntry[]
  thumbnails: DriveMediaEntry[]
  unmapped: DriveUnmappedEntry[]
}

type DriveFile = {
  id?: string | null
  name?: string | null
  mimeType?: string | null
  modifiedTime?: string | null
}

function resolveKeyPath(): string {
  const fromEnv = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim()
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(repoRoot, fromEnv)
  }
  const secretsDir = path.join(repoRoot, 'backend-app/secrets')
  if (fs.existsSync(secretsDir)) {
    const jsonFiles = fs
      .readdirSync(secretsDir)
      .filter((f) => f.endsWith('.json'))
    if (jsonFiles.length === 1) {
      return path.join(secretsDir, jsonFiles[0]!)
    }
    if (jsonFiles.length > 1) {
      console.warn(
        `Multiple JSON keys in ${secretsDir}; set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`,
      )
    }
  }
  throw new Error(
    'Set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON in .env (path to service account JSON)',
  )
}

/** Extract deliverable index from filenames like `1.mov`, `Video 1.mov`. */
export function parseFileIndex(name: string): number | null {
  const base = name.replace(/\.[^.]+$/, '').trim()
  const leading = base.match(/^(\d+)\b/)
  if (leading) return parseInt(leading[1]!, 10)
  const anywhere = base.match(/(?:^|\D)(\d+)(?:\D|$)/)
  return anywhere ? parseInt(anywhere[1]!, 10) : null
}

function isFolder(mimeType: string | null | undefined): boolean {
  return mimeType === 'application/vnd.google-apps.folder'
}

async function listChildren(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
): Promise<DriveFile[]> {
  const files: DriveFile[] = []
  let pageToken: string | undefined
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    files.push(...(res.data.files ?? []))
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)
  return files
}

function mapIndexedFiles(
  files: DriveFile[],
  slotLabel: string,
): { entries: DriveMediaEntry[]; unmapped: DriveUnmappedEntry[] } {
  const byIndex = new Map<number, DriveMediaEntry>()
  const unmapped: DriveUnmappedEntry[] = []

  for (const f of files) {
    if (!f.id || !f.name) continue
    if (isFolder(f.mimeType)) continue
    const index = parseFileIndex(f.name)
    if (index == null || index < 1) {
      unmapped.push({ name: f.name, reason: `Could not parse index (${slotLabel})` })
      continue
    }
    const entry: DriveMediaEntry = {
      index,
      driveFileId: f.id,
      name: f.name,
      mimeType: f.mimeType ?? 'application/octet-stream',
      modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    }
    const prev = byIndex.get(index)
    if (!prev || entry.modifiedTime > prev.modifiedTime) {
      byIndex.set(index, entry)
    }
  }

  const entries = [...byIndex.values()].sort((a, b) => a.index - b.index)
  return { entries, unmapped }
}

async function findSubfolderId(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  names: string[],
): Promise<string | null> {
  const children = await listChildren(drive, parentId)
  const normalized = names.map((n) => n.toLowerCase())
  for (const child of children) {
    if (!child.id || !child.name || !isFolder(child.mimeType)) continue
    if (normalized.includes(child.name.toLowerCase())) {
      return child.id
    }
  }
  return null
}

async function syncBatch(
  drive: ReturnType<typeof google.drive>,
  batchId: string,
  clipsFolderId: string,
  deliverablesFolderId: string,
): Promise<BatchDriveManifest> {
  const unmapped: DriveUnmappedEntry[] = []

  const clipFiles = await listChildren(drive, clipsFolderId)
  const clipsResult = mapIndexedFiles(clipFiles, 'clips')
  unmapped.push(...clipsResult.unmapped)

  const videoFolderId = await findSubfolderId(drive, deliverablesFolderId, [
    'video',
    'videos',
  ])
  const thumbFolderId = await findSubfolderId(drive, deliverablesFolderId, [
    'thumbnail',
    'thumbnails',
  ])

  let videos: DriveMediaEntry[] = []
  let thumbnails: DriveMediaEntry[] = []

  if (videoFolderId) {
    const videoFiles = await listChildren(drive, videoFolderId)
    const r = mapIndexedFiles(videoFiles, 'videos')
    videos = r.entries
    unmapped.push(...r.unmapped)
  } else {
    unmapped.push({
      name: '(folder)',
      reason: 'No Video subfolder in deliverables drive',
    })
  }

  if (thumbFolderId) {
    const thumbFiles = await listChildren(drive, thumbFolderId)
    const r = mapIndexedFiles(thumbFiles, 'thumbnails')
    thumbnails = r.entries
    unmapped.push(...r.unmapped)
  } else {
    unmapped.push({
      name: '(folder)',
      reason: 'No Thumbnail subfolder in deliverables drive',
    })
  }

  return {
    batchId,
    syncedAt: new Date().toISOString(),
    clips: clipsResult.entries,
    videos,
    thumbnails,
    unmapped,
  }
}

function emitTypeScript(manifests: BatchDriveManifest[]): string {
  const body = JSON.stringify(
    Object.fromEntries(manifests.map((m) => [m.batchId, m])),
    null,
    2,
  )
  return `/**
 * AUTO-GENERATED by scripts/sync-drive-manifest.ts — do not edit by hand.
 * Run: npm run drive:sync-manifests
 */
export type DriveMediaEntry = {
  index: number
  driveFileId: string
  name: string
  mimeType: string
  modifiedTime: string
}

export type DriveUnmappedEntry = {
  name: string
  reason: string
}

export type BatchDriveManifest = {
  batchId: string
  syncedAt: string
  clips: DriveMediaEntry[]
  videos: DriveMediaEntry[]
  thumbnails: DriveMediaEntry[]
  unmapped: DriveUnmappedEntry[]
}

export const DRIVE_MANIFESTS: Record<string, BatchDriveManifest> = ${body}
`
}

async function main() {
  const keyPath = resolveKeyPath()
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account key not found: ${keyPath}`)
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth })

  const manifests: BatchDriveManifest[] = []
  for (const cfg of DRIVE_MANIFEST_BATCH_CONFIG) {
    console.log(`Syncing batch ${cfg.batchId}…`)
    const manifest = await syncBatch(
      drive,
      cfg.batchId,
      cfg.clipsFolderId,
      cfg.deliverablesFolderId,
    )
    console.log(
      `  clips=${manifest.clips.length} videos=${manifest.videos.length} thumbnails=${manifest.thumbnails.length} unmapped=${manifest.unmapped.length}`,
    )
    manifests.push(manifest)
  }

  const outPath = path.join(repoRoot, 'frontend/mockData/driveManifests.ts')
  fs.writeFileSync(outPath, emitTypeScript(manifests), 'utf8')
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
