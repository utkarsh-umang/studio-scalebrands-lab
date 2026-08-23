import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Users, X } from 'lucide-react'
import { useTheme } from '@/theme'
import type { AdminClientProfile } from '@/types/pathB'
import { apiErrorMessage } from '@/lib/apiError'

type Props = {
  open: boolean
  clients: AdminClientProfile[]
  defaultClientId?: string
  onClose: () => void
  onCreate: (input: {
    clientId: string
    title: string
    creditCost: number
  }) => Promise<void>
}

export function CreateBatchFolderModal({
  open,
  clients,
  defaultClientId,
  onClose,
  onCreate,
}: Props) {
  const { theme } = useTheme()
  const activeClients = useMemo(
    () => clients.filter((c) => c.accountStatus === 'active'),
    [clients],
  )
  const [clientId, setClientId] = useState(
    defaultClientId ?? activeClients[0]?.id ?? '',
  )
  const [title, setTitle] = useState('')
  const [creditCost, setCreditCost] = useState('6')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedClient = activeClients.find((c) => c.id === clientId)

  useEffect(() => {
    if (!open) return
    setClientId(defaultClientId ?? activeClients[0]?.id ?? '')
    setTitle('')
    setCreditCost('6')
    setError(null)
    setSubmitting(false)
  }, [open, defaultClientId, activeClients])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!clientId) {
      setError('Select a client.')
      return
    }
    if (!title.trim()) {
      setError('Batch folder name is required.')
      return
    }
    const credits = Number.parseInt(creditCost, 10)
    if (!Number.isFinite(credits) || credits <= 0) {
      setError('Enter how many credits this batch will use.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onCreate({
        clientId,
        title: title.trim(),
        creditCost: credits,
      })
      onClose()
    } catch (createError) {
      setError(apiErrorMessage(createError, 'Could not create this batch.'))
    } finally {
      setSubmitting(false)
    }
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
        aria-labelledby="create-batch-title"
        style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="create-batch-title"
            className="text-foreground text-lg font-semibold"
          >
            Create batch
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!defaultClientId && (
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                Client
              </span>
              <select
                value={clientId}
                onChange={(ev) => {
                  setClientId(ev.target.value)
                }}
                className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              >
                {activeClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {selectedClient && (
            <div className="border-border bg-muted/20 space-y-3 rounded-xl border p-3">
              <div className="flex items-start gap-2">
                <Users className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden />
                <div className="min-w-0 text-xs">
                  <p className="text-foreground font-semibold">Assigned production team</p>
                  <p className="text-muted-foreground mt-1">
                    Editor: <span className="text-foreground">{selectedClient.assignedEditorName}</span>
                    {' · '}SMM: <span className="text-foreground">{selectedClient.assignedSmmName}</span>
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground border-border border-t pt-3 text-xs">
                <span className="text-foreground font-semibold tabular-nums">
                  {selectedClient.credits}
                </span>{' '}
                credits available. Credits are debited when every video in the batch is complete.
              </p>
            </div>
          )}
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Batch name
            </span>
            <input
              value={title}
              onChange={(ev) => {
                setTitle(ev.target.value)
              }}
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="e.g. September clipped videos"
              autoFocus={Boolean(defaultClientId)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Batch credit cost
            </span>
            <input
              value={creditCost}
              onChange={(ev) => {
                setCreditCost(ev.target.value)
              }}
              inputMode="numeric"
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm tabular-nums outline-none focus:ring-2"
            />
          </label>
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2.5">
            <p className="text-xs font-semibold text-blue-950">What happens next</p>
            <p className="mt-1 text-[11px] leading-relaxed text-blue-800">
              The batch appears in the client workspace. The client uploads their clipped raw
              videos directly to Studio, and every uploaded video becomes one production item
              for the assigned editor.
            </p>
          </div>
          {error && (
            <p className="text-destructive text-xs font-medium">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border-border text-foreground hover:bg-muted/40 rounded-xl border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              }}
            >
              {submitting ? 'Creating…' : 'Create batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
