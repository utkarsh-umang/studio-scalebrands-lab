import { useState } from 'react'
import { Copy, Image, Link2 } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import { STUDIO_DRIVE_READER_EMAIL } from '@/lib/studioDrive'
import { useTheme } from '@/theme'
import { useClientThumbnailsFolderMutation } from '@/hooks/api/pathB/useClientSuppliedAssetMutations'

type Props = {
  batch: AdminBatchFolder
}

/**
 * Shown only when the batch's thumbnail step is client-owned. The folder is
 * flat and numbered (1.png, 2.png, …) to match the clip indices — unlike the
 * editor's deliverables root, which nests videos/ and thumbnails/.
 */
export function ClientThumbnailsFolderCard({ batch }: Props) {
  const { theme } = useTheme()
  const mutation = useClientThumbnailsFolderMutation(batch.id)
  const saved = batch.clientThumbnailsFolderUrl ?? ''
  const [url, setUrl] = useState(saved)
  const [editing, setEditing] = useState(false)

  // The board keeps this component mounted and swaps the batch prop, so state
  // seeded at mount would carry one batch's link into the next. Re-seed during
  // render when the batch (or the saved link) changes, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const syncKey = `${batch.id}|${saved}`
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey)
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey)
    setUrl(saved)
    setEditing(false)
  }

  const primary = theme.colors.primary
  const submitted = Boolean(saved.trim())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed || mutation.isPending) return
    mutation.mutate(trimmed)
  }

  return (
    <div
      className="border-border bg-background w-full rounded-lg border p-3 shadow-sm"
      style={{ borderColor: `${primary}40` }}
    >
      <div className="flex items-start gap-2">
        <Image className="mt-0.5 size-3.5 shrink-0" style={{ color: primary }} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="text-foreground block text-xs font-semibold">
            {submitted ? 'Thumbnails folder linked' : 'Send us your thumbnails'}
          </span>
          <span className="text-muted-foreground block text-[10px] leading-snug">
            You are making the thumbnails for this batch
          </span>
        </span>
      </div>

      <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
        {submitted && !editing ? (
          // Linked: the job is done, so show what we have rather than an empty
          // form asking for something the client already sent.
          <div className="space-y-2">
            <p className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
              <Link2 className="size-3" aria-hidden />
              Thumbnails folder
            </p>
            <a
              href={saved}
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:text-primary block break-all text-xs underline underline-offset-2"
            >
              {saved}
            </a>
            <p className="text-muted-foreground text-[10px] leading-snug">
              We will pull the images from here. Re-syncing picks up any changes you
              make in the folder.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditing(true)
              }}
              className="border-border text-muted-foreground hover:text-foreground w-full rounded-lg border py-1.5 text-xs font-semibold"
            >
              Change link
            </button>
          </div>
        ) : (
          <>
        <div
          className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs leading-snug"
          role="status"
        >
          <p className="text-foreground font-semibold">
            Name the files to match the clip numbers
          </p>
          <p className="text-muted-foreground mt-1">
            One image per clip — <strong className="text-foreground">1.png</strong>,{' '}
            <strong className="text-foreground">2.png</strong>, and so on. Share the
            folder as a <strong className="text-foreground">Viewer</strong> with:
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="bg-background/80 border-border text-foreground max-w-full break-all rounded border px-2 py-1 font-mono text-[11px]">
              {STUDIO_DRIVE_READER_EMAIL}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(STUDIO_DRIVE_READER_EMAIL)
              }}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
            >
              <Copy className="size-3" aria-hidden />
              Copy
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <label
            htmlFor={`thumbs-url-${batch.id}`}
            className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
          >
            <Link2 className="size-3" aria-hidden />
            Thumbnails folder link
          </label>
          <input
            id={`thumbs-url-${batch.id}`}
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
            }}
            placeholder="https://drive.google.com/drive/folders/..."
            className="border-border bg-background text-foreground w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          {mutation.isError && (
            <p className="text-destructive text-[10px] leading-snug" role="alert">
              Could not save the folder. Check the link and try again.
            </p>
          )}
          <div className="flex gap-2">
            {submitted && (
              <button
                type="button"
                onClick={() => {
                  setUrl(saved)
                  setEditing(false)
                }}
                className="border-border text-muted-foreground hover:text-foreground shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!url.trim() || mutation.isPending}
              className="bg-primary text-primary-foreground disabled:opacity-50 w-full rounded-lg py-1.5 text-xs font-semibold"
            >
              {mutation.isPending ? 'Saving…' : submitted ? 'Update link' : 'Send thumbnails'}
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  )
}
