import { AppShell } from '@/components/AppShell'

export function ClientDashboard() {
  return (
    <AppShell title="Client dashboard" subtitle="Your batches and approvals">
      <div className="border-border bg-background rounded-xl border p-6">
        <p className="text-muted-foreground text-sm">
          Placeholder — credits, batches, and approvals will connect here.
        </p>
      </div>
    </AppShell>
  )
}
