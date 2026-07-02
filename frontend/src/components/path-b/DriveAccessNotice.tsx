import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Copy, Info } from 'lucide-react'
import type { DriveDiagnosticsDto } from '@/client'

type Slot = 'clips' | 'deliverables'
type Tone = 'ok' | 'warn' | 'error'

type Props = {
  diagnostics?: DriveDiagnosticsDto | null
  slot: Slot
  unmapped?: { name: string; reason: string }[]
  className?: string
}

type Notice = { tone: Tone; title: string; detail?: string; showEmail?: boolean }

function unmappedNames(unmapped: { name: string; reason: string }[] | undefined, slot: Slot): string[] {
  if (!unmapped) return []
  return unmapped
    .filter((u) => u.reason.toLowerCase().includes(slot === 'clips' ? 'clip' : 'video') || u.name !== '(folder)')
    .map((u) => u.name)
    .filter((n) => n && !n.startsWith('('))
    .slice(0, 4)
}

function clipsNotice(d: DriveDiagnosticsDto, names: string[]): Notice | null {
  const c = d.clips
  switch (c.status) {
    case 'not_linked':
      return null
    case 'bad_link':
      return { tone: 'error', title: "That link isn't a Google Drive folder", detail: 'Paste the folder share URL (drive.google.com/drive/folders/…).' }
    case 'no_access':
      return { tone: 'error', title: "Studio can't open this folder", detail: 'Share it as Viewer with the address below, then press Sync.', showEmail: true }
    case 'empty':
      return { tone: 'warn', title: 'Folder is shared but empty', detail: 'Add your numbered clips (1.mov, 2.mov, …) then press Sync.' }
    case 'partial':
      return {
        tone: 'warn',
        title: `${c.numbered} of ${c.total} files loaded`,
        detail: names.length
          ? `Not numbered 1…n: ${names.join(', ')} — rename them and Sync.`
          : 'Some files could not be numbered 1…n — rename them and Sync.',
      }
    case 'ok':
      return { tone: 'ok', title: `${c.numbered} clip${c.numbered === 1 ? '' : 's'} loaded from Drive` }
    default:
      return null
  }
}

function deliverablesNotice(d: DriveDiagnosticsDto, names: string[]): Notice | null {
  const v = d.deliverables
  switch (v.status) {
    case 'not_linked':
      return null
    case 'bad_link':
      return { tone: 'error', title: "That link isn't a Google Drive folder", detail: 'Paste the deliverables folder share URL.' }
    case 'no_access':
      return { tone: 'error', title: "Studio can't open the deliverables folder", detail: 'Share it as Viewer with the address below, then press Sync.', showEmail: true }
    case 'missing_subfolders': {
      const missing = [
        !v.hasVideosSubfolder ? 'videos/' : null,
        !v.hasThumbnailsSubfolder ? 'thumbnails/' : null,
      ].filter(Boolean)
      return { tone: 'warn', title: `Missing ${missing.join(' and ')} subfolder${missing.length > 1 ? 's' : ''}`, detail: 'The deliverables folder must contain videos/ and thumbnails/ with numbered files.' }
    }
    case 'empty':
      return { tone: 'warn', title: 'Deliverables folder is shared but empty', detail: 'Add videos/ and thumbnails/ subfolders with numbered files.' }
    case 'partial':
      return { tone: 'warn', title: `${v.videos} video${v.videos === 1 ? '' : 's'}, ${v.thumbnails} thumbnail${v.thumbnails === 1 ? '' : 's'} loaded`, detail: names.length ? `Not numbered 1…n: ${names.join(', ')}.` : 'Some files could not be numbered 1…n.' }
    case 'ok':
      return { tone: 'ok', title: `${v.videos} video${v.videos === 1 ? '' : 's'} and ${v.thumbnails} thumbnail${v.thumbnails === 1 ? '' : 's'} loaded` }
    default:
      return null
  }
}

const toneClass: Record<Tone, string> = {
  ok: 'border-emerald-500/30 bg-emerald-500/5 text-foreground',
  warn: 'border-amber-500/35 bg-amber-500/5 text-foreground',
  error: 'border-destructive/35 bg-destructive/5 text-foreground',
}

export function DriveAccessNotice({ diagnostics, slot, unmapped, className = '' }: Props) {
  const [copied, setCopied] = useState(false)
  if (!diagnostics) return null

  const names = unmappedNames(unmapped, slot)
  const notice = slot === 'clips' ? clipsNotice(diagnostics, names) : deliverablesNotice(diagnostics, names)
  if (!notice) return null

  const email = diagnostics.serviceAccountEmail ?? undefined
  const Icon = notice.tone === 'ok' ? CheckCircle2 : notice.tone === 'warn' ? Info : AlertTriangle

  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed ${toneClass[notice.tone]} ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold">{notice.title}</p>
        {notice.detail ? <p className="text-muted-foreground mt-0.5">{notice.detail}</p> : null}
        {notice.showEmail && email ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <code className="bg-muted/60 rounded px-1.5 py-0.5 text-xs">{email}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(email).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                })
              }}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
            >
              <Copy className="size-3" aria-hidden />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
