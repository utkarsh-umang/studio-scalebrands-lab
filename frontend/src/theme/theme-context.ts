import { createContext } from 'react'
import type { AppTheme } from './types'

export type ThemeContextValue = {
  theme: AppTheme
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
