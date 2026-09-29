import React from 'react'
import { MainLayout as LegacySkinLayout } from '~/legacy/ui/MainLayout'

/**
 * Which outer chrome the app renders. Two values, no third planned.
 *
 * `legacy` is the default and is the skin users have. `modern` is the seam for a
 * future replacement; today it renders the page with no chrome of its own,
 * because the current pages still bring their own layout.
 */
export type EhSkin = 'legacy' | 'modern'

/**
 * Per-device browser state, deliberately not a url and not server state: the
 * same link has to open the same page for everyone, whichever skin they picked.
 */
const STORAGE_KEY = 'uiSkin'

export function getUiSkin(): EhSkin {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'modern' ? 'modern' : 'legacy'
  } catch {
    // Storage can throw outright (private mode, blocked third-party context).
    return 'legacy'
  }
}

/**
 * Takes effect on the next load. Re-rendering live would mean carrying the skin
 * in React state, and there is nothing yet that switches it mid-session.
 */
export function setUiSkin(skin: EhSkin): void {
  try {
    localStorage.setItem(STORAGE_KEY, skin)
  } catch {
    // Nothing to do — the choice just does not persist.
  }
}

export function EhShell({ children }: { children: React.ReactNode }) {
  if (getUiSkin() === 'modern') {
    return <>{children}</>
  }
  return <LegacySkinLayout>{children}</LegacySkinLayout>
}
