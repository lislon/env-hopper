'use client'

import { useState } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

/**
 * Rewrites a JSON-encoded theme choice to the bare string `next-themes` expects.
 *
 * The previous UI stored every localStorage value JSON-encoded, so a returning
 * user who chose dark has `"dark"` — quotes included — under the key
 * `next-themes` reads. `next-themes` puts the stored value straight onto
 * `<html>`'s class list, so that user got `class='"dark"'`, a token no selector
 * matches, and a light page under a toggle showing dark. Their choice was kept
 * and silently not applied.
 *
 * Done in this component's render, which runs before `NextThemesProvider`'s own
 * initial read, rather than at module load, which would run before a test or an
 * earlier script could have written the value it is meant to repair.
 */
function normalizeStoredTheme(storageKey: string): void {
  try {
    const stored = localStorage.getItem(storageKey)
    if (
      stored &&
      stored.length > 1 &&
      stored.startsWith('"') &&
      stored.endsWith('"')
    ) {
      localStorage.setItem(storageKey, stored.slice(1, -1))
    }
  } catch {
    // Storage can throw outright (private mode); there is nothing to repair.
  }
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  useState(() => normalizeStoredTheme(props.storageKey ?? 'theme'))
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
