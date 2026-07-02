import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { StudioModalShell } from '@/components/StudioModalShell'
import { useCreditHistoryQuery } from '@/hooks/api/admin/useCreditHistoryQuery'

type Props = {
  clientId: string | null
  clientName?: string
  open: boolean
  onClose: () => void
}

const KIND_LABEL: Record<string, string> = {
  top_up: 'Top-up (payment received)',
  debit_batch: 'Batch completed — credits debited',
}

function formatAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function CreditHistoryModal({ clientId, clientName, open, onClose }: Props) {
  const { data, isLoading, isError } = useCreditHistoryQuery(clientId, open)
  const items = data?.items ?? []

  if (!open || !clientId) return null

  return (
    <StudioModalShell
      title="Credit history"
      subtitle={clientName ? `${clientName} · top-ups & debits` : 'Top-ups & debits'}
      titleId="credit-history-title"
      onClose={onClose}
    >
      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Loading history…</p>
      ) : isError ? (
        <p className="text-destructive py-8 text-center text-sm">Could not load credit history.</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No credit activity yet. Top-ups and batch debits will appear here.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {items.map((item) => {
            const positive = item.amount >= 0
            return (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight className="size-4" aria-hidden />
                  ) : (
                    <ArrowDownRight className="size-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {KIND_LABEL[item.kind] ?? item.kind}
                  </p>
                  <p className="text-muted-foreground text-xs">{formatAt(item.at)}</p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    positive ? 'text-emerald-600' : 'text-destructive'
                  }`}
                >
                  {positive ? '+' : ''}
                  {item.amount} credits
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </StudioModalShell>
  )
}
