import { AppShell } from '@/components/AppShell'

export function AdminDashboard() {
  return (
    <AppShell title="Admin" subtitle="Operations">
      <div className="border-border bg-background rounded-xl border p-6">
        <p className="text-muted-foreground text-sm">
          Placeholder — clients, credits, pipeline overview, and deadlines will
          connect here.
        </p>
      </div>
    </AppShell>
  )
}
