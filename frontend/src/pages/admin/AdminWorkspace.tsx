import { useMemo, useState } from 'react'
import { CalendarClock, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminClientsTable } from '@/components/admin/AdminClientsTable'
import { AdminPipelineOverview } from '@/components/admin/AdminPipelineOverview'
import { ProvisionClientModal } from '@/components/admin/ProvisionClientModal'
import {
  computeAdminPipelineSummary,
  listAdminPipelineItems,
} from '@/lib/adminPipeline'
import { clientReservedCredits } from '@/lib/clientBoard'
import { useTheme } from '@/theme'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

export function AdminWorkspace() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { clients, batches, videos, getActiveBatchNumber, provisionClient } =
    useAdminWorkspace()
  const [provisionOpen, setProvisionOpen] = useState(false)
  const ink = theme.colors.foreground
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary

  const activeClients = useMemo(
    () => clients.filter((c) => c.accountStatus === 'active'),
    [clients],
  )
  const decommissionedClients = useMemo(
    () => clients.filter((c) => c.accountStatus === 'decommissioned'),
    [clients],
  )

  const pipelineSummary = useMemo(
    () => computeAdminPipelineSummary(batches, videos),
    [batches, videos],
  )
  const pipelineItems = useMemo(
    () => listAdminPipelineItems(batches, videos, clients),
    [batches, videos, clients],
  )

  const activeRows = useMemo(
    () =>
      activeClients.map((client) => {
        const clientBatches = batches.filter(
          (b) => b.clientId === client.id && b.status === 'active',
        )
        return {
          client,
          activeBatchNumber: getActiveBatchNumber(client.id),
          reservedCredits: clientReservedCredits(clientBatches),
        }
      }),
    [activeClients, batches, getActiveBatchNumber],
  )

  const decommissionedRows = useMemo(
    () =>
      decommissionedClients.map((client) => ({
        client,
        activeBatchNumber: null as number | null,
        reservedCredits: 0,
      })),
    [decommissionedClients],
  )

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          className="font-[family-name:var(--heading)] text-2xl font-bold tracking-tight"
          style={{ color: ink }}
        >
          Workspace
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/deadlines"
            className="border-border bg-background/85 text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-xl transition-colors"
          >
            <CalendarClock className="size-3.5" aria-hidden />
            Deadlines
          </Link>
          <button
            type="button"
            onClick={() => {
              setProvisionOpen(true)
            }}
            className="text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            }}
          >
            <UserPlus className="size-4" aria-hidden />
            Provision new client
          </button>
        </div>
      </div>

      <AdminPipelineOverview summary={pipelineSummary} items={pipelineItems} />

      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Clients</h2>
        <AdminClientsTable rows={activeRows} />
      </section>

      {decommissionedRows.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">Decommissioned</h2>
          <AdminClientsTable rows={decommissionedRows} viewOnly />
        </section>
      )}

      <ProvisionClientModal
        open={provisionOpen}
        onClose={() => {
          setProvisionOpen(false)
        }}
        onProvision={(input) => {
          const client = provisionClient(input)
          navigate(`/admin/clients/${client.id}`, {
            state: { showCredentials: true },
          })
        }}
      />
    </>
  )
}
