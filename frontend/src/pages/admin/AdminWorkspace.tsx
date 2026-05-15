import { useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AdminClientsTable } from '@/components/admin/AdminClientsTable'
import { ProvisionClientModal } from '@/components/admin/ProvisionClientModal'
import { useTheme } from '@/theme'
import { useAdminWorkspace } from '@/pages/admin/adminWorkspaceStore'

export function AdminWorkspace() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { clients, getActiveBatchNumber, provisionClient } = useAdminWorkspace()
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

  const activeRows = useMemo(
    () =>
      activeClients.map((client) => ({
        client,
        activeBatchNumber: getActiveBatchNumber(client.id),
      })),
    [activeClients, getActiveBatchNumber],
  )

  const decommissionedRows = useMemo(
    () =>
      decommissionedClients.map((client) => ({
        client,
        activeBatchNumber: null as number | null,
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

      <AdminClientsTable rows={activeRows} />

      {decommissionedRows.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">
            Decommissioned
          </h2>
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
