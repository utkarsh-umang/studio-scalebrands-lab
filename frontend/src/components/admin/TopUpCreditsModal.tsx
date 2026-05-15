import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '@/theme'

type Props = {
  open: boolean
  displayName: string
  currentCredits: number
  onClose: () => void
  onTopUp: (amount: number) => void
}

export function TopUpCreditsModal({
  open,
  displayName,
  currentCredits,
  onClose,
  onTopUp,
}: Props) {
  const { theme } = useTheme()
  const [amount, setAmount] = useState('6')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAmount('6')
    setError(null)
  }, [open])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const n = Number.parseInt(amount, 10)
    if (!Number.isFinite(n) || n <= 0) {
      setError('Enter a positive number of credits.')
      return
    }
    onTopUp(n)
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
        aria-labelledby="top-up-title"
        style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="top-up-title"
            className="text-foreground text-lg font-semibold"
          >
            Top up credits
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
        <p className="text-muted-foreground mt-1 text-sm">{displayName}</p>

        <p className="text-foreground mt-4 text-sm">
          Current balance:{' '}
          <span className="font-semibold tabular-nums">{currentCredits}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Credits to add
            </span>
            <input
              value={amount}
              onChange={(ev) => {
                setAmount(ev.target.value)
              }}
              inputMode="numeric"
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm tabular-nums outline-none focus:ring-2"
              autoFocus
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {[6, 12, 24].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(String(preset))
                }}
                className="border-border text-foreground hover:border-primary/35 rounded-lg border px-2.5 py-1 text-xs font-medium"
              >
                +{preset}
              </button>
            ))}
          </div>
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
              Add credits
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
