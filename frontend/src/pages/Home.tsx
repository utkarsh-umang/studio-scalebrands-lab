import { useHealthQuery } from '@/hooks/api/useHealthQuery'
import { Loader } from '@/components/Loader'

export function Home() {
  const { data, isLoading, error } = useHealthQuery()

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold text-foreground">Welcome</h1>
      <p className="text-muted-foreground">
        React + TypeScript + Vite frontend template
      </p>
      <section className="border-border bg-surface mt-6 rounded-lg border p-4">
        <h2 className="text-muted-foreground text-sm font-medium">
          API health check
        </h2>
        {isLoading && (
          <div className="mt-2 flex justify-center">
            <Loader />
          </div>
        )}
        {error && (
          <p className="text-destructive mt-2 text-sm">
            API unreachable: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}
        {data !== undefined && (
          <div className="text-success mt-2 text-sm">
            <p>API connected. Status: {data.status}</p>
            <p className="text-muted-foreground mt-1">
              Postgres: {data.postgres} · Mongo: {data.mongo} · Redis: {data.redis}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
