import { useLayoutEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { homePathForUser, useAuth } from '@/auth'
import logo from '@/assets/logo.png'
import { useTheme } from '@/theme'

export function LoginPage() {
  const { theme } = useTheme()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useLayoutEffect(() => {
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [])

  if (user) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const result = await login(email, password)
      if (result.ok) {
        const dest =
          from && from !== '/login' ? from : homePathForUser(result.user)
        navigate(dest, { replace: true })
      } else {
        setError(result.message)
      }
    } finally {
      setPending(false)
    }
  }

  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const accent = theme.colors.accent
  const ink = theme.colors.foreground

  return (
    <div
      className="fixed inset-0 flex h-dvh max-h-dvh w-full flex-col overflow-hidden overscroll-none md:flex-row"
      style={{
        background: `
          radial-gradient(ellipse 90% 65% at 10% 0%, ${primary}2e 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 95% 15%, ${secondary}35 0%, transparent 50%),
          radial-gradient(ellipse 55% 45% at 50% 100%, ${accent}28 0%, transparent 45%),
          linear-gradient(165deg, #f0f7ff 0%, ${theme.colors.surface} 38%, #ffffff 100%)
        `,
      }}
    >
      {/* Texture + grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(5, 9, 14, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(5, 9, 14, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 size-[420px] rounded-full blur-3xl md:size-[520px]"
        style={{ background: `${primary}18` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 size-[380px] rounded-full blur-3xl"
        style={{ background: `${secondary}20` }}
        aria-hidden
      />

      {/* Brand column */}
      <section className="relative flex min-h-0 shrink-0 flex-col justify-between px-6 pb-4 pt-8 md:w-[46%] md:max-w-xl md:px-10 md:pb-10 md:pt-14 lg:px-14">
        <div className="min-h-0">
          <div className="mb-5 flex items-center gap-3 md:mb-8 md:gap-3.5">
            <img
              src={logo}
              alt=""
              className="h-9 w-auto shrink-0 object-contain md:h-11"
            />
            <p className="text-balance font-[family-name:var(--heading)] text-xl font-bold leading-[1.15] tracking-tight md:text-2xl lg:text-[2.75rem] lg:leading-[1.1]">
              <span className="block" style={{ color: ink }}>
                ScaleBrandsLab
              </span>
            </p>
          </div>

          <h1
            className="max-w-md text-balance font-[family-name:var(--heading)] text-2xl font-bold leading-[1.15] tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
            style={{
              color: ink,
            }}
          >
            Your pipeline,
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(115deg, ${primary}, ${secondary} 55%, ${accent})`,
              }}
            >
              one sign-in.
            </span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md text-pretty text-sm leading-snug md:mt-5 md:text-base">
            Approve clips, review edits, and ship schedules — without losing
            feedback in the chat scroll.
          </p>
        </div>
      </section>

      {/* Form column */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col justify-center px-4 pb-6 pt-0 md:px-8 md:pb-10 md:pt-10 lg:px-12">
        <div
          className="border-border/80 bg-background/85 supports-[backdrop-filter]:bg-background/70 mx-auto w-full max-w-[400px] rounded-2xl border p-5 shadow-[0_24px_80px_-16px_rgba(5,9,14,0.18)] backdrop-blur-xl md:p-7"
          style={{
            boxShadow: `
              0 24px 80px -16px rgba(5, 9, 14, 0.18),
              0 0 0 1px rgba(255, 255, 255, 0.6) inset
            `,
          }}
        >
          <div className="mb-4 md:mb-5">
            <h2 className="text-foreground text-lg font-semibold md:text-xl">
              Sign in
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-snug md:text-sm">
              Work email and password. Your role comes from your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-3.5">
            <div>
              <label
                htmlFor="login-email"
                className="text-muted-foreground mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] md:text-[11px]"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                }}
                className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/40 h-10 w-full rounded-xl border px-3 text-sm outline-none ring-0 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] md:h-11 md:text-[15px]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="text-muted-foreground mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] md:text-[11px]"
              >
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                className="border-border bg-background/90 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/40 h-10 w-full rounded-xl border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] md:h-11 md:text-[15px]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                className="text-destructive bg-destructive/[0.07] rounded-lg px-3 py-2 text-xs leading-snug md:text-sm"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="bg-primary text-primary-foreground hover:brightness-[1.03] focus-visible:ring-primary mt-0.5 inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold shadow-md transition-[filter,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 md:h-11"
              style={{
                boxShadow: `0 10px 28px -6px ${primary}55`,
              }}
            >
              {pending ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
