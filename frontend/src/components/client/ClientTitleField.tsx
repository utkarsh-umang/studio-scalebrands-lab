import { useState } from 'react'
import { Type } from 'lucide-react'
import type { AdminVideoTicket } from '@/types/pathB'
import { useClientTitleMutation } from '@/hooks/api/pathB/useClientSuppliedAssetMutations'

type Props = {
  ticket: AdminVideoTicket
}

/**
 * Per-clip publish title, for batches where the title step is client-owned.
 * Writes the same field the editor would (editorPublishTitle) — ownership is
 * about who is expected to fill it in, not a separate piece of data.
 */
export function ClientTitleField({ ticket }: Props) {
  const mutation = useClientTitleMutation(ticket.id)
  const saved = ticket.editorPublishTitle ?? ''
  const [draft, setDraft] = useState(saved)

  // Re-sync when switching between clips inside the modal, or after a save.
  const [prevSaved, setPrevSaved] = useState(saved)
  const [prevTicketId, setPrevTicketId] = useState(ticket.id)
  if (saved !== prevSaved || ticket.id !== prevTicketId) {
    setPrevSaved(saved)
    setPrevTicketId(ticket.id)
    setDraft(saved)
  }

  const dirty = draft.trim() !== saved.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || !dirty || mutation.isPending) return
    mutation.mutate(trimmed)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-muted/10 space-y-2 rounded-xl border p-3"
    >
      <label
        htmlFor={`client-title-${ticket.id}`}
        className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
      >
        <Type className="size-3" aria-hidden />
        Your title for this video
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`client-title-${ticket.id}`}
          type="text"
          value={draft}
          maxLength={512}
          onChange={(e) => {
            setDraft(e.target.value)
          }}
          placeholder="e.g. The hiring mistake that cost us $40k"
          className="border-border bg-background text-foreground w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || !dirty || mutation.isPending}
          className="bg-primary text-primary-foreground shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : dirty ? 'Save title' : 'Saved'}
        </button>
      </div>
      {mutation.isError && (
        <p className="text-destructive text-[10px] leading-snug" role="alert">
          Could not save the title. Try again.
        </p>
      )}
    </form>
  )
}
