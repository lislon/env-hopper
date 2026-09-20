'use client'
import React, { createContext, useContext, useLayoutEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type EhTheme = 'dark' | 'light'

//  createContext is not supported in Server Components

export interface ThemeContextValue {
  userPreference: EhTheme
  setUserPreference: (theme: EhTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }

  return {
    currentTheme: ctx.userPreference,
    switchTheme: () => {
      if (getTheme() === 'dark') {
        switchTheme('light')
        ctx.setUserPreference('light')
      } else {
        switchTheme('dark')
        ctx.setUserPreference('dark')
      }
    },
  }
}

function getSystemTheme(): EhTheme {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * INTENTIONAL DIFF: the previous UI only set `data-theme`, which its own
 * stylesheet keys on. The current stylesheet keys dark mode on a `.dark` class
 * instead, and both sheets are loaded, so the switch writes BOTH — otherwise
 * flipping the skin's theme leaves everything outside `.eh-legacy` (the modal
 * portals, the current UI's chrome) on the other theme.
 */
function switchTheme(theme: EhTheme) {
  const html = document.querySelector('html')
  html?.setAttribute('data-theme', theme)
  html?.classList.toggle('dark', theme === 'dark')
}

function getTheme(): EhTheme {
  const theme =
    document.querySelector('html')?.getAttribute('data-theme') || undefined
  if (theme === undefined) {
    return getSystemTheme()
  } else if (theme === 'dark') {
    return 'dark'
  } else {
    return 'light'
  }
}

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [userPreference, setUserPreference] = useLocalStorage<EhTheme>(
    'theme',
    getTheme(),
  )
  // The original ran this mount-only with `userPreference` read out of a stale
  // closure. `switchTheme` is idempotent and the switch already writes the DOM
  // itself, so declaring the dependency changes no behaviour and drops a lint
  // error the repo treats as fatal.
  useLayoutEffect(() => {
    switchTheme(userPreference)
  }, [userPreference])

  return (
    <ThemeContext.Provider value={{ userPreference, setUserPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}
