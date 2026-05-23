import { useMemo, useState } from 'react'
import { CalendarClock, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminClientsTable } from '@/components/admin/AdminClientsTable'
import { AdminPipelineOverview } from '@/components/admin/AdminPipelineOverview'
import { ProvisionClientModal } from '@/components/admin/ProvisionClientModal'
import { useAdminClientsQuery } from '@/hooks/api/admin/useAdminClientsQuery'
import { useAdminPipelineQuery } from '@/hooks/api/admin/useAdminPipelineQuery'
import { useProvisionClientMutation } from '@/hooks/api/admin/useAdminMutations'
import { useTheme } from '@/theme'

export function AdminWorkspace() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { data: clientRows = [], isLoading: clientsLoading } = useAdminClientsQuery()
  const { data: pipeline, isLoading: pipelineLoading } = useAdminPipelineQuery()
  const provisionMutation = useProvisionClientMutation()
  const [provisionOpen, setProvisionOpen] = useState(false)
  const ink = theme.colors.foreground
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary

  const activeRows = useMemo(
    () => clientRows.filter((r) => r.client.accountStatus === 'active'),
    [clientRows],
  )
  const decommissionedRows = useMemo(
    () => clientRows.filter((r) => r.client.accountStatus === 'decommissioned'),
    [clientRows],
  )

  const pipelineSummary = pipeline?.summary ?? {
    withClient: 0,
    withSmm: 0,
    withEditor: 0,
  }
  const pipelineItems = pipeline?.items ?? []

  const loading = clientsLoading || pipelineLoading

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

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading workspace…</p>
      ) : (
        <AdminPipelineOverview summary={pipelineSummary} items={pipelineItems} />
      )}

      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Clients</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading clients…</p>
        ) : (
          <AdminClientsTable rows={activeRows} />
        )}
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
          void provisionMutation
            .mutateAsync({
              loginId: input.loginId,
              displayName: input.displayName,
              password: input.password,
              initialCredits: input.initialCredits,
            })
            .then((result) => {
              navigate(`/admin/clients/${result.client.id}`, {
                state: {
                  credentials: {
                    loginId: result.credentials.email,
                    password: result.credentials.password,
                  },
                },
              })
            })
        }}
      />
    </>
  )
}
