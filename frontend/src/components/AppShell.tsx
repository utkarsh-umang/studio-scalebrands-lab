import { Film, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTheme } from '@/theme'
import { useMockAuth } from '@/auth'

type AppShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const { theme } = useTheme()
  const { user, logout } = useMockAuth()

  return (
    <div className="bg-background flex min-h-svh w-full flex-col">
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-lg text-[var(--primary-foreground)]"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
            }}
          >
            <Film className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">{title}</p>
            {user && (
              <p className="text-muted-foreground text-xs">
                {user.name}
                {subtitle ? ` · ${subtitle}` : ''}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
          }}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--border)]"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
