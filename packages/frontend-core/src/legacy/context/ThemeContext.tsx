'use client'
import React, { createContext, use, useLayoutEffect, useState } from 'react'

export type EhTheme = 'dark' | 'light'

/**
 * Shared with `next-themes`, which defaults to this exact key and, with
 * `attribute="class"`, assigns the stored value STRAIGHT ONTO `<html>`'s class
 * list on every load.
 *
 * So the value has to be stored as a bare string. Writing it JSON-encoded — as
 * the previous UI's storage hook does for everything — made the theme survive a
 * click and then break on the next load: the other writer set
 * `class='"dark"'`, a token that matches no selector, while overwriting the
 * `dark` class this file had added. `data-theme` stayed correct, so the switch
 * showed the right icon over a page that had silently reverted to light. Every
 * dark screenshot in the pixel gate was that bug.
 */
const THEME_STORAGE_KEY = 'theme'

function readStoredTheme(): EhTheme | undefined {
  try {
    // Tolerates a JSON-encoded value left behind by an earlier build.
    const raw = localStorage.getItem(THEME_STORAGE_KEY)?.replace(/^"|"$/g, '')
    return raw === 'dark' || raw === 'light' ? raw : undefined
  } catch {
    return undefined
  }
}

function writeStoredTheme(theme: EhTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can throw outright; the choice just does not persist.
  }
}

//  createContext is not supported in Server Components

export interface ThemeContextValue {
  userPreference: EhTheme
  setUserPreference: (theme: EhTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = use(ThemeContext)
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
  const [userPreference, setStoredPreference] = useState<EhTheme>(
    () => readStoredTheme() ?? getTheme(),
  )
  const setUserPreference = (theme: EhTheme) => {
    writeStoredTheme(theme)
    setStoredPreference(theme)
  }
  // The original ran this mount-only with `userPreference` read out of a stale
  // closure. `switchTheme` is idempotent and the switch already writes the DOM
  // itself, so declaring the dependency changes no behaviour and drops a lint
  // error the repo treats as fatal.
  useLayoutEffect(() => {
    switchTheme(userPreference)
  }, [userPreference])

  return (
    <ThemeContext value={{ userPreference, setUserPreference }}>
      {children}
    </ThemeContext>
  )
}
