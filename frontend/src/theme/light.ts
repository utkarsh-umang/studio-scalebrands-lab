/**
 * Light theme tokens — brand palette:
 * Primary brand #1F57F5, secondary #2BAFF2, accent #00DDFF,
 * ink #05090E, canvas #FFFFFF.
 */
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    background: '#FFFFFF',
    foreground: '#05090E',
    primary: '#1F57F5',
    primaryForeground: '#FFFFFF',
    secondary: '#2BAFF2',
    secondaryForeground: '#05090E',
    accent: '#00DDFF',
    accentForeground: '#05090E',
    muted: 'rgba(5, 9, 14, 0.08)',
    mutedForeground: 'rgba(5, 9, 14, 0.62)',
    border: 'rgba(5, 9, 14, 0.12)',
    surface: '#F8FAFC',
    codeBackground: 'rgba(5, 9, 14, 0.06)',
    ring: '#1F57F5',
    success: '#15803d',
    destructive: '#b91c1c',
    destructiveForeground: '#FFFFFF',
  },
} as const

export type LightTheme = typeof lightTheme
