import { useState, type FormEvent } from 'react'
import { CreditCard, Plus, UserPlus } from 'lucide-react'
import { useTheme } from '@/theme'
import { MOCK_ADMIN_CLIENTS, type AdminClientAccount } from '@mockData/index'
import { ClientPageHeader, formatDate } from '@/pages/client/clientPageUtils'

export function AdminClients() {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const [rows, setRows] = useState<AdminClientAccount[]>(MOCK_ADMIN_CLIENTS)
  const [loginId, setLoginId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [initialCredits, setInitialCredits] = useState('24')
  const [banner, setBanner] = useState<string | null>(null)

  function handleProvision(e: FormEvent) {
    e.preventDefault()
    if (!loginId.trim() || !displayName.trim()) {
      setBanner('Login ID and display name are required.')
      return
    }
    const credits = Number.parseInt(initialCredits, 10)
    const next: AdminClientAccount = {
      id: `c-${Date.now()}`,
      loginId: loginId.trim(),
      displayName: displayName.trim(),
      credits: Number.isFinite(credits) ? Math.max(0, credits) : 0,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setRows((prev) => [next, ...prev])
    setBanner(`Demo: created “${next.displayName}” — not persisted.`)
    setLoginId('')
    setDisplayName('')
    setPassword('')
    setInitialCredits('24')
  }

  return (
    <>
      <ClientPageHeader
        title="Clients"
        subtitle="Provision logins and manage credit balances after offline payment."
      />

      <div
        className="border-border bg-background/85 rounded-2xl border p-5 backdrop-blur-xl md:p-6"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${primary}16` }}
          >
            <UserPlus className="size-5" style={{ color: primary }} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-foreground text-base font-semibold">
              Provision new client
            </h2>
            <p className="text-muted-foreground text-sm">
              In production, credentials are issued securely. This form is a UI
              prototype only.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleProvision}
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="space-y-1.5 sm:col-span-2">
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
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
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
          <label className="space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Temporary password
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
          <label className="space-y-1.5">
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
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-95"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              }}
            >
              <Plus className="size-4" aria-hidden />
              Create account (demo)
            </button>
          </div>
        </form>
        {banner && (
          <p className="text-muted-foreground mt-4 text-xs">{banner}</p>
        )}
      </div>

      <section className="space-y-3">
        <ClientPageHeader
          title="All clients"
          subtitle="Credits reflect manual top-ups after payment — no in-app checkout in v1."
        />
        <div
          className="border-border bg-background/85 overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset`,
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-border bg-muted/30 border-b text-xs uppercase tracking-wide">
                  <th className="text-muted-foreground px-5 py-3 font-semibold">
                    Client
                  </th>
                  <th className="text-muted-foreground px-5 py-3 font-semibold">
                    Login ID
                  </th>
                  <th className="text-muted-foreground px-5 py-3 font-semibold">
                    Credits
                  </th>
                  <th className="text-muted-foreground px-5 py-3 font-semibold">
                    Added
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-right font-semibold">
                    Top up
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {rows.map((row) => (
                  <AdminClientRowControls
                    key={row.id}
                    row={row}
                    onTopUp={(amount) => {
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? { ...r, credits: r.credits + amount }
                            : r,
                        ),
                      )
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}

function AdminClientRowControls({
  row,
  onTopUp,
}: {
  row: AdminClientAccount
  onTopUp: (amount: number) => void
}) {
  const { theme } = useTheme()
  const primary = theme.colors.primary

  return (
    <tr className="hover:bg-muted/20">
      <td className="px-5 py-4">
        <p className="text-foreground font-medium">{row.displayName}</p>
      </td>
      <td className="text-muted-foreground px-5 py-4 font-mono text-xs">
        {row.loginId}
      </td>
      <td className="px-5 py-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
          style={{
            background: `${primary}12`,
            color: primary,
            border: `1px solid ${primary}30`,
          }}
        >
          <CreditCard className="size-3.5 opacity-80" aria-hidden />
          {row.credits}
        </span>
      </td>
      <td className="text-muted-foreground px-5 py-4 text-xs">
        {formatDate(row.createdAt)}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="inline-flex flex-wrap justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              onTopUp(6)
            }}
            className="border-border bg-background/90 text-foreground hover:border-primary/35 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            +6
          </button>
          <button
            type="button"
            onClick={() => {
              onTopUp(12)
            }}
            className="border-border bg-background/90 text-foreground hover:border-primary/35 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            +12
          </button>
        </div>
      </td>
    </tr>
  )
}
