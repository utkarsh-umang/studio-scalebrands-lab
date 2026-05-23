import { useNavigate } from 'react-router-dom'
import type { AdminClientProfile } from '@/types/pathB'

type Row = {
  client: AdminClientProfile
  activeBatchNumber: number | null
  reservedCredits?: number
}

type Props = {
  rows: Row[]
  viewOnly?: boolean
}

export function AdminClientsTable({ rows, viewOnly }: Props) {
  const navigate = useNavigate()

  return (
    <div
      className="border-border bg-background/90 overflow-hidden rounded-xl border backdrop-blur-xl"
      style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-border bg-muted/30 border-b">
            <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
              Client
            </th>
            <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
              Batch active
            </th>
            <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
              Credits
            </th>
            {!viewOnly && (
              <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                Reserved
              </th>
            )}
            {!viewOnly && (
              <th className="text-muted-foreground px-5 py-3 text-right text-xs font-semibold">
                Actions
              </th>
            )}
            {viewOnly && (
              <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                Reason
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={viewOnly ? 4 : 5}
                className="text-muted-foreground px-5 py-8 text-center text-sm"
              >
                —
              </td>
            </tr>
          ) : (
            rows.map(({ client, activeBatchNumber, reservedCredits = 0 }) => (
              <tr key={client.id} className="hover:bg-muted/20">
                <td className="text-foreground px-5 py-4 font-medium">
                  {client.displayName}
                </td>
                <td className="text-foreground px-5 py-4 tabular-nums">
                  {viewOnly ? '—' : (activeBatchNumber ?? '—')}
                </td>
                <td className="px-5 py-4">
                  <span className="text-foreground font-semibold tabular-nums">
                    {client.credits}
                  </span>
                  <span className="text-muted-foreground block text-[10px]">
                    Available balance
                  </span>
                </td>
                {!viewOnly && (
                  <td className="text-muted-foreground px-5 py-4 tabular-nums text-xs">
                    {reservedCredits > 0 ? (
                      <>
                        <span className="text-foreground font-medium">
                          {reservedCredits}
                        </span>
                        <span className="block text-[10px]">
                          On active batches until complete
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                {!viewOnly && (
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/admin/clients/${client.id}`)
                      }}
                      className="border-border bg-background text-foreground hover:border-primary/35 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                      View details
                    </button>
                  </td>
                )}
                {viewOnly && (
                  <td className="text-muted-foreground max-w-xs px-5 py-4 text-xs">
                    {client.decommissionReason ?? '—'}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
