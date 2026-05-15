import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  displayName: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function DecommissionClientModal({
  open,
  displayName,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReason('')
    setError(null)
  }, [open])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('A reason is required.')
      return
    }
    onConfirm(reason.trim())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="border-border bg-background relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-xl"
        role="dialog"
        aria-modal
        aria-labelledby="decommission-title"
        style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="decommission-title"
            className="text-destructive text-lg font-semibold"
          >
            Decommission client
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {displayName} will move to the decommissioned list and lose access to
          new work.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Reason for discontinuing
            </span>
            <textarea
              value={reason}
              onChange={(ev) => {
                setReason(ev.target.value)
              }}
              rows={4}
              className="border-border bg-background focus:ring-destructive/25 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Why did the client decide to stop working with us?"
              autoFocus
            />
          </label>
          {error && (
            <p className="text-destructive text-xs font-medium">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border-border text-foreground hover:bg-muted/40 rounded-xl border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-destructive text-destructive-foreground rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Decommission
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
