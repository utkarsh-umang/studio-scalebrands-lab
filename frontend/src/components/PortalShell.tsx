import type { LucideIcon } from 'lucide-react'
import { LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { useAuth } from '@/auth'
import { NotificationBell } from '@/components/NotificationBell'

export type PortalNavItem = {
  to: string
  label: string
  Icon: LucideIcon
  end?: boolean
}

type Props = {
  roleLabel: string
  fallbackName: string
  ProfileIcon: LucideIcon
  nav: readonly PortalNavItem[]
  showNotifications?: boolean
}

export function PortalShell({
  roleLabel,
  fallbackName,
  ProfileIcon,
  nav,
  showNotifications = true,
}: Props) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#f4f6fa] md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0a1222] text-white md:h-dvh md:w-[264px] md:border-b-0 md:border-r">
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3.5 md:px-5 md:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
              <img src={logo} alt="" className="size-8 rounded-lg object-contain" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.01em]">
                Scale Brands Lab
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                Studio
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-300 md:hidden">
            {roleLabel}
          </span>
        </div>

        <div className="hidden px-5 pb-3 pt-2 md:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
        </div>

        <nav className="flex min-w-0 gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-3">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'group flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all md:w-full',
                  isActive
                    ? 'border-white/10 bg-white/10 text-white shadow-sm'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}
          {showNotifications ? <NotificationBell variant="sidebar" /> : null}
        </nav>

        <div className="hidden border-t border-white/10 p-3 md:block">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/[0.07]">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
              <ProfileIcon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name ?? fallbackName}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="relative min-h-full px-4 py-6 sm:px-6 md:px-8 md:py-8 xl:px-10">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-80"
              style={{
                background:
                  'radial-gradient(circle at 15% 0%, rgba(31,87,245,0.10), transparent 42%), radial-gradient(circle at 88% 10%, rgba(43,175,242,0.10), transparent 36%)',
              }}
              aria-hidden
            />
            <div className="relative mx-auto w-full max-w-[1480px] space-y-7">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
