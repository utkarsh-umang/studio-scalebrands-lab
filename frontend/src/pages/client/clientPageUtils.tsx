import type { ReactNode } from 'react'
import { useTheme } from '@/theme'

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function ClientPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  const { theme } = useTheme()
  const ink = theme.colors.foreground

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1
          className="font-[family-name:var(--heading)] text-xl font-bold tracking-tight md:text-2xl"
          style={{ color: ink }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground max-w-2xl text-sm leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  )
}
