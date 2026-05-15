import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '@/theme'
import type { AdminClientProfile } from '@mockData/index'

type Props = {
  open: boolean
  clients: AdminClientProfile[]
  defaultClientId?: string
  onClose: () => void
  onCreate: (input: {
    clientId: string
    title: string
    footageUrl?: string
    creditCost: number
  }) => void
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
  const [footageUrl, setFootageUrl] = useState('')
  const [creditCost, setCreditCost] = useState('6')
  const [error, setError] = useState<string | null>(null)

  const selectedClient = activeClients.find((c) => c.id === clientId)

  useEffect(() => {
    if (!open) return
    setClientId(defaultClientId ?? activeClients[0]?.id ?? '')
    setTitle('')
    setFootageUrl('')
    setCreditCost('6')
    setError(null)
  }, [open, defaultClientId, activeClients])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
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
    onCreate({
      clientId,
      title: title.trim(),
      footageUrl: footageUrl.trim() || undefined,
      creditCost: credits,
    })
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
        aria-labelledby="create-batch-title"
        style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="create-batch-title"
            className="text-foreground text-lg font-semibold"
          >
            New batch folder
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
            <p className="text-muted-foreground text-xs">
              Client balance:{' '}
              <span className="text-foreground font-semibold tabular-nums">
                {selectedClient.credits}
              </span>{' '}
              credits (debited when every clip in this batch is done)
            </p>
          )}
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Folder name
            </span>
            <input
              value={title}
              onChange={(ev) => {
                setTitle(ev.target.value)
              }}
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="e.g. Q3 launch clips"
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
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Raw footage URL (optional)
            </span>
            <input
              value={footageUrl}
              onChange={(ev) => {
                setFootageUrl(ev.target.value)
              }}
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="https://drive.google.com/..."
            />
            <span className="text-muted-foreground block text-[11px] leading-snug">
              Internal reference only — the client still submits their podcast or clips
              link from their dashboard to kick off the batch.
            </span>
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
              className="text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              }}
            >
              Create folder
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
