import { AppShell } from '@/components/AppShell'

export function EditorDashboard() {
  return (
    <AppShell title="Editor" subtitle="Task queue">
      <div className="border-border bg-background rounded-xl border p-6">
        <p className="text-muted-foreground text-sm">
          Placeholder — editing tasks and QA resolution will connect here.
        </p>
      </div>
    </AppShell>
  )
}
