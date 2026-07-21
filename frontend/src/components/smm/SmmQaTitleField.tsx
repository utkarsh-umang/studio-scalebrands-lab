import { useState } from 'react'
import { Type } from 'lucide-react'
import type { AdminVideoTicket } from '@/types/pathB'

type Props = {
  ticket: AdminVideoTicket
  pending: boolean
  error: string | null
  onSave: (title: string) => void
}

/**
 * Publish title, written on the QA screen.
 *
 * The editor hands off as soon as their own part is done, so an SMM-owned title
 * is usually still blank when the video reaches QA. Without a field here the
 * ticket dead-ends: no way to add the title, and approval is refused for the
 * same missing title.
 */
export function SmmQaTitleField({ ticket, pending, error, onSave }: Props) {
  const saved = ticket.editorPublishTitle ?? ''
  const [draft, setDraft] = useState(saved)

  // Re-seed during render when the ticket or the saved title changes — the board
  // reuses this modal across cards.
  const syncKey = `${ticket.id}|${saved}`
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey)
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey)
    setDraft(saved)
  }

  const dirty = draft.trim() !== saved.trim()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = draft.trim()
        if (!trimmed || !dirty || pending) return
        onSave(trimmed)
      }}
      className="border-border bg-muted/15 space-y-2 rounded-xl border px-4 py-3"
    >
      <label
        htmlFor={`smm-qa-title-${ticket.id}`}
        className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
      >
        <Type className="size-3" aria-hidden />
        Publish title
        {!saved.trim() ? ' — still needed' : ''}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`smm-qa-title-${ticket.id}`}
          type="text"
          value={draft}
          maxLength={512}
          onChange={(e) => {
            setDraft(e.target.value)
          }}
          placeholder="Title this video will be published under"
          className="border-border bg-background text-foreground w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || !dirty || pending}
          className="bg-primary text-primary-foreground shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {pending ? 'Saving…' : dirty ? 'Save title' : 'Saved'}
        </button>
      </div>
      {error ? (
        <p className="text-destructive text-[10px] leading-snug" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
