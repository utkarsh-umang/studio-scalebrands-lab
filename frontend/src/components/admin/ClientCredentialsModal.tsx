import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'

type Props = {
  open: boolean
  displayName: string
  loginId: string
  password: string
  title?: string
  onClose: () => void
}

export function ClientCredentialsModal({
  open,
  displayName,
  loginId,
  password,
  title = 'Client login',
  onClose,
}: Props) {
  const [copiedField, setCopiedField] = useState<'login' | 'password' | null>(
    null,
  )

  if (!open) return null

  async function copy(value: string, field: 'login' | 'password') {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch {
      /* clipboard unavailable */
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
        aria-labelledby="client-credentials-title"
        style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="client-credentials-title"
            className="text-foreground text-lg font-semibold"
          >
            {title}
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

        <dl className="mt-6 space-y-4">
          <CredentialRow
            label="Login ID"
            value={loginId}
            copied={copiedField === 'login'}
            onCopy={() => {
              void copy(loginId, 'login')
            }}
          />
          <CredentialRow
            label="Password"
            value={password || 'Not set'}
            copied={copiedField === 'password'}
            onCopy={() => {
              if (password) void copy(password, 'password')
            }}
            disableCopy={!password}
          />
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted/40 rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function CredentialRow({
  label,
  value,
  copied,
  onCopy,
  disableCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
  disableCopy?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="flex items-center gap-2">
        <code className="bg-code-bg text-foreground min-w-0 flex-1 break-all rounded-lg px-3 py-2 font-mono text-sm">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          disabled={disableCopy}
          className="border-border text-muted-foreground hover:text-foreground shrink-0 rounded-lg border p-2 transition-colors disabled:opacity-40"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="text-success size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
        </button>
      </dd>
    </div>
  )
}
