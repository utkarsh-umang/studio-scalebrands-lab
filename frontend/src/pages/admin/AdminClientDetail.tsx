import { useMemo, useState } from 'react'
import { ArrowLeft, Coins, ExternalLink, History, KeyRound, Pencil } from 'lucide-react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { AdminVideoKanban } from '@/components/admin/AdminVideoKanban'
import { BatchActivityModal } from '@/components/BatchActivityModal'
import { CreditHistoryModal } from '@/components/admin/CreditHistoryModal'
import { BatchOwnershipControls } from '@/components/path-b/BatchOwnershipControls'
import { ClientCredentialsModal } from '@/components/admin/ClientCredentialsModal'
import { CreateBatchFolderModal } from '@/components/admin/CreateBatchFolderModal'
import { DecommissionClientModal } from '@/components/admin/DecommissionClientModal'
import { TopUpCreditsModal } from '@/components/admin/TopUpCreditsModal'
import { useAdminBatchVideosQuery } from '@/hooks/api/admin/useAdminBatchVideosQuery'
import { useAdminClientBatchesQuery } from '@/hooks/api/admin/useAdminClientBatchesQuery'
import { useAdminClientQuery } from '@/hooks/api/admin/useAdminClientQuery'
import { useAdminStaffQuery } from '@/hooks/api/admin/useAdminStaffQuery'
import { useSetVideoDeadlineMutation } from '@/hooks/api/admin/useSetVideoDeadlineMutation'
import {
  useCreateBatchMutation,
  useDecommissionClientMutation,
  useSetBatchAssignmentsMutation,
  useTopUpCreditsMutation,
  useUpdateBrandGuidelinesMutation,
  useUpdateClientTeamMutation,
} from '@/hooks/api/admin/useAdminMutations'
import { useTheme } from '@/theme'
import { clientReservedCredits } from '@/lib/clientBoard'
import { guidelinesSourceLabel } from '@/lib/guidelinesSourceLabel'
import { formatDate } from '@/pages/client/clientPageUtils'

type DetailLocationState = {
  showCredentials?: boolean
  credentials?: { loginId: string; password: string }
}

export function AdminClientDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary

  const clientQuery = useAdminClientQuery(clientId)
  const batchesQuery = useAdminClientBatchesQuery(clientId)
  const setVideoDeadline = useSetVideoDeadlineMutation()
  const staffQuery = useAdminStaffQuery()
  const topUpMutation = useTopUpCreditsMutation(clientId ?? '')
  const decommissionMutation = useDecommissionClientMutation(clientId ?? '')
  const teamMutation = useUpdateClientTeamMutation(clientId ?? '')
  const guidelinesMutation = useUpdateBrandGuidelinesMutation(clientId ?? '')
  const createBatchMutation = useCreateBatchMutation(clientId ?? '')

  const locationState = location.state as DetailLocationState | null
  const provisionCredentials = locationState?.credentials

  const [createOpen, setCreateOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [creditHistoryOpen, setCreditHistoryOpen] = useState(false)
  const [decommissionOpen, setDecommissionOpen] = useState(false)
  const [credentialsOpen, setCredentialsOpen] = useState(
    () =>
      Boolean(
        locationState?.showCredentials && locationState?.credentials,
      ),
  )
  const [teamEditing, setTeamEditing] = useState(false)
  const [guidelinesEditing, setGuidelinesEditing] = useState(false)
  const [draftSmmId, setDraftSmmId] = useState('')
  const [draftEditorId, setDraftEditorId] = useState('')
  const [draftSummary, setDraftSummary] = useState('')
  const [draftGoogleDocUrl, setDraftGoogleDocUrl] = useState('')

  const client = clientQuery.data?.client
  const allBatches = batchesQuery.data ?? []
  const smmStaff = staffQuery.data?.smmStaff ?? []
  const editorStaff = staffQuery.data?.editorStaff ?? []

  const activeBatches = useMemo(
    () => allBatches.filter((b) => b.status === 'active'),
    [allBatches],
  )

  const completedBatches = useMemo(
    () => allBatches.filter((b) => b.status === 'completed'),
    [allBatches],
  )

  const selectedBatchId =
    searchParams.get('batch') ??
    activeBatches[0]?.id ??
    null
  const selectedBatch =
    activeBatches.find((b) => b.id === selectedBatchId) ?? activeBatches[0]
  const setBatchAssignments = useSetBatchAssignmentsMutation(selectedBatch?.id ?? '')

  const videosQuery = useAdminBatchVideosQuery(clientId, selectedBatch?.id)
  const batchTickets = videosQuery.data ?? []

  const reservedCredits =
    clientQuery.data?.reservedCredits ??
    clientReservedCredits(activeBatches)

  const creditsDebitedTotal = clientQuery.data?.creditsDebitedTotal ?? 0

  // Reset the edit drafts during render (not in an effect) when the client
  // data identity changes, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevClient, setPrevClient] = useState(client)
  if (client && client !== prevClient) {
    setPrevClient(client)
    setDraftSmmId(client.assignedSmmId)
    setDraftEditorId(client.assignedEditorId)
    setDraftSummary(client.brandGuidelines.summary)
    setDraftGoogleDocUrl(client.brandGuidelines.googleDocUrl ?? '')
  }

  if (!clientId) {
    return <Navigate to="/admin" replace />
  }

  if ((clientQuery.isLoading || batchesQuery.isLoading) && !client) {
    return (
      <p className="text-muted-foreground text-sm">Loading client…</p>
    )
  }

  if (!client) {
    return <Navigate to="/admin" replace />
  }

  const g = client.brandGuidelines
  const isActive = client.accountStatus === 'active'

  function saveTeam() {
    if (!client) return
    void teamMutation
      .mutateAsync({
        smmId: draftSmmId,
        editorId: draftEditorId,
      })
      .then(() => {
        setTeamEditing(false)
      })
  }

  function saveGuidelines() {
    if (!client) return
    void guidelinesMutation
      .mutateAsync({
        summary: draftSummary,
        googleDocUrl: draftGoogleDocUrl.trim() || undefined,
      })
      .then(() => {
        setGuidelinesEditing(false)
      })
  }

  const hasGuidelines =
    g.summary.trim().length > 0 || Boolean(g.googleDocUrl?.trim())

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/admin"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1 transition-colors"
            aria-label="Back to workspace"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="text-foreground truncate text-2xl font-bold tracking-tight">
              {client.displayName}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              <span className="text-foreground font-semibold tabular-nums">
                {client.credits}
              </span>{' '}
              credits available
              {reservedCredits > 0 ? (
                <span className="text-muted-foreground">
                  {' '}
                  · {reservedCredits} reserved on active batches
                </span>
              ) : null}
              {creditsDebitedTotal > 0 ? (
                <span className="text-muted-foreground block text-xs">
                  {creditsDebitedTotal} credits debited from completed batches
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {provisionCredentials ? (
            <button
              type="button"
              onClick={() => {
                setCredentialsOpen(true)
              }}
              className="border-border bg-background text-foreground hover:border-primary/35 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
            >
              <KeyRound className="size-4" aria-hidden />
              Login credentials
            </button>
          ) : null}
          {isActive && (
            <>
              <button
                type="button"
                onClick={() => {
                  setTopUpOpen(true)
                }}
                className="border-border bg-background text-foreground hover:border-primary/35 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Coins className="size-4" aria-hidden />
                Top up credits
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreditHistoryOpen(true)
                }}
                className="border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/35 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <History className="size-4" aria-hidden />
                Credit history
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(true)
                }}
                className="text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                }}
              >
                New batch folder
              </button>
              <button
                type="button"
                onClick={() => {
                  setDecommissionOpen(true)
                }}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
              >
                Decommission
              </button>
            </>
          )}
        </div>
      </div>

      {!isActive && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm">
          Decommissioned
          {client.decommissionedAt
            ? ` · ${formatDate(client.decommissionedAt)}`
            : ''}
          {client.decommissionReason ? ` — ${client.decommissionReason}` : ''}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="border-border bg-background/90 space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-foreground text-sm font-semibold">
              Brand guidelines
            </h2>
            {!guidelinesEditing ? (
              <button
                type="button"
                onClick={() => {
                  setGuidelinesEditing(true)
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                <Pencil className="size-3" aria-hidden />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftSummary(client.brandGuidelines.summary)
                    setDraftGoogleDocUrl(
                      client.brandGuidelines.googleDocUrl ?? '',
                    )
                    setGuidelinesEditing(false)
                  }}
                  className="text-muted-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveGuidelines}
                  className="text-primary text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            )}
          </div>
          {guidelinesEditing ? (
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-muted-foreground text-xs font-medium">
                  Notes
                </span>
                <textarea
                  value={draftSummary}
                  onChange={(ev) => {
                    setDraftSummary(ev.target.value)
                  }}
                  rows={4}
                  className="border-border bg-background focus:ring-primary/25 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  placeholder="Tone, visual rules, do's and don'ts…"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-muted-foreground text-xs font-medium">
                  Google Doc link
                </span>
                <input
                  value={draftGoogleDocUrl}
                  onChange={(ev) => {
                    setDraftGoogleDocUrl(ev.target.value)
                  }}
                  className="border-border bg-background focus:ring-primary/25 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  placeholder="https://docs.google.com/document/..."
                />
              </label>
            </div>
          ) : hasGuidelines ? (
            <>
              {g.summary.trim() && (
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {g.summary}
                </p>
              )}
              {g.googleDocUrl && (
                <a
                  href={g.googleDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  {guidelinesSourceLabel(g.source)}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
              {!g.googleDocUrl && g.summary.trim() && (
                <p className="text-muted-foreground text-xs">
                  {guidelinesSourceLabel(g.source)}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Not set yet.</p>
          )}
        </section>

        <section className="border-border bg-background/90 space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-foreground text-sm font-semibold">
              Assigned team
            </h2>
            {!teamEditing ? (
              <button
                type="button"
                onClick={() => {
                  setTeamEditing(true)
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                <Pencil className="size-3" aria-hidden />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftSmmId(client.assignedSmmId)
                    setDraftEditorId(client.assignedEditorId)
                    setTeamEditing(false)
                  }}
                  className="text-muted-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveTeam}
                  className="text-primary text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">SMM</span>
              {teamEditing ? (
                <select
                  value={draftSmmId}
                  onChange={(ev) => {
                    setDraftSmmId(ev.target.value)
                  }}
                  className="border-border bg-background max-w-[160px] rounded-lg border px-2 py-1 text-xs"
                >
                  {smmStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-foreground font-medium">
                  {client.assignedSmmName}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Editor</span>
              {teamEditing ? (
                <select
                  value={draftEditorId}
                  onChange={(ev) => {
                    setDraftEditorId(ev.target.value)
                  }}
                  className="border-border bg-background max-w-[160px] rounded-lg border px-2 py-1 text-xs"
                >
                  {editorStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-foreground font-medium">
                  {client.assignedEditorName}
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {isActive && activeBatches.length > 0 && selectedBatch && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {activeBatches.length > 1 &&
              activeBatches.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => {
                    setSearchParams({ batch: batch.id })
                  }}
                  className={[
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    batch.id === selectedBatch.id
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  Batch {batch.batchNumber}: {batch.title}
                </button>
              ))}
            {activeBatches.length === 1 && (
              <h2 className="text-foreground text-sm font-semibold">
                Batch {selectedBatch.batchNumber}: {selectedBatch.title}
              </h2>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {selectedBatch.creditCost} credits for this batch
            {selectedBatch.creditsDebited
              ? ' · debited at batch complete'
              : ' · debited when every deliverable is scheduled'}
            {selectedBatch.demoStage ? (
              <span className="text-muted-foreground/80">
                {' '}
                · Stage: {selectedBatch.demoStage.replace(/_/g, ' ')}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => {
              setActivityOpen(true)
            }}
            className="text-muted-foreground hover:text-foreground border-border hover:border-primary/35 mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            <History className="size-3.5" aria-hidden />
            Activity &amp; approvals
          </button>
          <div className="border-border bg-muted/10 mt-2 rounded-xl border p-3">
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wide">
              Who owns each shared step
            </p>
            <BatchOwnershipControls
              clipOwnerKind={selectedBatch.clipOwnerKind ?? null}
              thumbnailOwnerKind={selectedBatch.thumbnailOwnerKind ?? null}
              titleOwnerKind={selectedBatch.titleOwnerKind ?? null}
              smmName={client.assignedSmmName}
              editorName={client.assignedEditorName}
              clientName={client.displayName}
              onChange={(next) => {
                setBatchAssignments.mutate(next)
              }}
            />
          </div>
          <AdminVideoKanban
            tickets={batchTickets}
            onDeadlineChange={(videoId, deadlineAt) => {
              setVideoDeadline.mutate({
                videoTicketId: videoId,
                body: { deadlineAt },
              })
            }}
          />
        </section>
      )}

      {completedBatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">
            Completed batches
          </h2>
          <div className="border-border bg-background/90 overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-border bg-muted/30 border-b">
                  <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                    Batch
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                    Videos
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                    Start
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                    End
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                    Credits
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-xs font-semibold">
                    Debited
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {completedBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-muted/20">
                    <td className="text-foreground px-5 py-3 font-medium">
                      {batch.title}
                    </td>
                    <td className="text-foreground px-5 py-3 tabular-nums">
                      {batch.videoCount}
                    </td>
                    <td className="text-muted-foreground px-5 py-3 text-xs">
                      {formatDate(batch.createdAt)}
                    </td>
                    <td className="text-muted-foreground px-5 py-3 text-xs">
                      {formatDate(batch.completedAt ?? batch.updatedAt)}
                    </td>
                    <td className="text-foreground px-5 py-3 tabular-nums">
                      {batch.creditCost}
                    </td>
                    <td className="text-muted-foreground px-5 py-3 text-xs">
                      {batch.creditsDebited ? 'Yes' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {provisionCredentials ? (
        <ClientCredentialsModal
          open={credentialsOpen}
          displayName={client.displayName}
          loginId={provisionCredentials.loginId}
          password={provisionCredentials.password}
          onClose={() => {
            setCredentialsOpen(false)
          }}
        />
      ) : null}

      <TopUpCreditsModal
        open={topUpOpen}
        displayName={client.displayName}
        currentCredits={client.credits}
        onClose={() => {
          setTopUpOpen(false)
        }}
        onTopUp={(amount) => {
          void topUpMutation.mutateAsync({ amount })
        }}
      />

      <DecommissionClientModal
        open={decommissionOpen}
        displayName={client.displayName}
        onClose={() => {
          setDecommissionOpen(false)
        }}
        onConfirm={(reason) => {
          void decommissionMutation.mutateAsync({ reason }).then(() => {
            navigate('/admin')
          })
        }}
      />

      <CreateBatchFolderModal
        open={createOpen}
        clients={[client]}
        defaultClientId={client.id}
        onClose={() => {
          setCreateOpen(false)
        }}
        onCreate={(input) => {
          void createBatchMutation
            .mutateAsync({
              title: input.title,
              creditCost: input.creditCost,
              footageUrl: input.footageUrl,
            })
            .then((folder) => {
              setSearchParams({ batch: folder.id })
              setCreateOpen(false)
            })
        }}
      />
      <BatchActivityModal
        batchId={activityOpen ? (selectedBatch?.id ?? null) : null}
        batchTitle={selectedBatch?.title}
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false)
        }}
      />

      <CreditHistoryModal
        clientId={creditHistoryOpen ? client.id : null}
        clientName={client.displayName}
        open={creditHistoryOpen}
        onClose={() => {
          setCreditHistoryOpen(false)
        }}
      />
    </>
  )
}