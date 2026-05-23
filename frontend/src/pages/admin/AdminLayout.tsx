import { CalendarClock, LayoutGrid, LogOut, Shield, UserPlus } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { useAuth } from '@/auth'
import { useTheme } from '@/theme'
const NAV = [
  { to: '/admin', label: 'Workspace', Icon: LayoutGrid, end: true },
  { to: '/admin/employees', label: 'Add Employees', Icon: UserPlus, end: false },
  { to: '/admin/deadlines', label: 'Deadlines', Icon: CalendarClock, end: false },
] as const

export function AdminLayout() {
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const accent = theme.colors.accent
  const ink = theme.colors.foreground

  return (
    <div className="bg-background flex h-[100vh] max-h-[100vh] w-full flex-col overflow-hidden md:flex-row">
        <aside className="border-border bg-background/95 flex h-auto max-h-[100vh] w-full shrink-0 flex-col overflow-hidden border-b backdrop-blur md:h-[100vh] md:w-56 md:max-h-[100vh] md:border-b-0 md:border-r">
          <div className="border-border flex shrink-0 items-center gap-3 border-b px-4 py-4">
            <img
              src={logo}
              alt=""
              className="h-9 w-auto shrink-0 object-contain"
            />
            <p
              className="font-[family-name:var(--heading)] text-lg font-bold leading-tight tracking-tight md:text-xl"
              style={{ color: ink }}
            >
              ScaleBrandsLab
            </p>
          </div>

          <div className="border-border shrink-0 px-3 py-3">
            <div
              className="flex items-center gap-2 rounded-lg px-2 py-2"
              style={{ background: `${primary}12` }}
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${primary}22` }}
              >
                <Shield
                  className="size-3.5"
                  style={{ color: primary }}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-semibold">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-muted-foreground text-[10px] capitalize">
                  Admin
                </p>
              </div>
            </div>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-2 pb-2">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        background: `${primary}14`,
                        border: `1px solid ${primary}35`,
                        boxShadow: `0 0 0 1px ${accent}12`,
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-border mt-auto shrink-0 border-t p-2">
            <button
              type="button"
              onClick={() => {
                logout()
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors"
            >
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:h-[100vh] md:max-h-[100vh]">
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div
              className="relative min-h-full px-4 py-6 md:px-8 md:py-8"
              style={{
                background: `
                radial-gradient(ellipse 80% 55% at 8% 0%, ${primary}18 0%, transparent 52%),
                radial-gradient(ellipse 65% 45% at 92% 8%, ${secondary}22 0%, transparent 48%),
                radial-gradient(ellipse 50% 40% at 50% 100%, ${accent}14 0%, transparent 42%),
                linear-gradient(180deg, ${theme.colors.surface} 0%, #ffffff 55%)
              `,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.22]"
                style={{
                  backgroundImage: `
                  linear-gradient(rgba(5, 9, 14, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(5, 9, 14, 0.03) 1px, transparent 1px)
                `,
                  backgroundSize: '48px 48px',
                }}
                aria-hidden
              />
              <div className="relative w-full max-w-none space-y-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
    </div>
  )
}
