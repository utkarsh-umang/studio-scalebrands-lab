import type { AppTheme } from './types'

/** Maps theme colors to CSS custom properties used by `index.css` and Tailwind `@theme`. */
export function applyThemeToDocument(theme: AppTheme): void {
  const root = document.documentElement
  root.dataset.theme = theme.mode

  const { colors } = theme
  const entries: [string, string][] = [
    ['--background', colors.background],
    ['--foreground', colors.foreground],
    ['--primary', colors.primary],
    ['--primary-foreground', colors.primaryForeground],
    ['--secondary', colors.secondary],
    ['--secondary-foreground', colors.secondaryForeground],
    ['--accent', colors.accent],
    ['--accent-foreground', colors.accentForeground],
    ['--muted', colors.muted],
    ['--muted-foreground', colors.mutedForeground],
    ['--border', colors.border],
    ['--surface', colors.surface],
    ['--code-bg', colors.codeBackground],
    ['--ring', colors.ring],
    ['--success', colors.success],
    ['--destructive', colors.destructive],
    ['--destructive-foreground', colors.destructiveForeground],
  ]

  for (const [name, value] of entries) {
    root.style.setProperty(name, value)
  }
}
