import {
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { applyThemeToDocument } from './applyTheme'
import { lightTheme } from './light'
import { ThemeContext, type ThemeContextValue } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: lightTheme,
    }),
    [],
  )

  useLayoutEffect(() => {
    applyThemeToDocument(lightTheme)
  }, [])

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}
