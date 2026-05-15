import { useEffect, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useTheme } from '@/theme'

export type ProvisionClientInput = {
  loginId: string
  displayName: string
  password: string
  initialCredits: number
}

type Props = {
  open: boolean
  onClose: () => void
  onProvision: (input: ProvisionClientInput) => void
}

export function ProvisionClientModal({ open, onClose, onProvision }: Props) {
  const { theme } = useTheme()
  const [loginId, setLoginId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [initialCredits, setInitialCredits] = useState('24')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoginId('')
    setDisplayName('')
    setPassword('')
    setInitialCredits('24')
    setError(null)
  }, [open])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!loginId.trim() || !displayName.trim()) {
      setError('Login ID and display name are required.')
      return
    }
    const credits = Number.parseInt(initialCredits, 10)
    onProvision({
      loginId: loginId.trim(),
      displayName: displayName.trim(),
      password,
      initialCredits: Number.isFinite(credits) ? Math.max(0, credits) : 0,
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
        aria-labelledby="provision-client-title"
        style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="provision-client-title"
            className="text-foreground text-lg font-semibold"
          >
            Provision new client
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
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Login ID
            </span>
            <input
              value={loginId}
              onChange={(ev) => {
                setLoginId(ev.target.value)
              }}
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="e.g. acme.creative"
              autoComplete="off"
              autoFocus
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Display name
            </span>
            <input
              value={displayName}
              onChange={(ev) => {
                setDisplayName(ev.target.value)
              }}
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Client brand or contact"
              autoComplete="off"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Password
            </span>
            <input
              value={password}
              onChange={(ev) => {
                setPassword(ev.target.value)
              }}
              type="password"
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Initial credits
            </span>
            <input
              value={initialCredits}
              onChange={(ev) => {
                setInitialCredits(ev.target.value)
              }}
              inputMode="numeric"
              className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm tabular-nums outline-none focus:ring-2"
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
              className="text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              }}
            >
              <Plus className="size-4" aria-hidden />
              Create client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
