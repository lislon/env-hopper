import type { ShownReleaseTrains } from '@env-hopper/backend-core'

/**
 * The last release trains seen per App, so a revisit renders at once instead
 * of growing the panel when the answer lands (layout shift). Kept per device.
 */
const KEY = 'eh.releaseTrains.v1'
/** Apps remembered; the least recently seen go first. */
const MAX_APPS = 30

type Remembered = Record<
  string,
  { at: number; data: ShownReleaseTrains | null }
>

function readAll(): Remembered {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Remembered
  } catch {
    return {}
  }
}

export function recall(
  appSlug: string,
): { at: number; data: ShownReleaseTrains | null } | undefined {
  return readAll()[appSlug]
}

export function remember(
  appSlug: string,
  data: ShownReleaseTrains | null,
): void {
  try {
    const all = { ...readAll(), [appSlug]: { at: Date.now(), data } }
    const kept = Object.entries(all)
      .sort(([, a], [, b]) => b.at - a.at)
      .slice(0, MAX_APPS)
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(kept)))
  } catch {
    // Storage full or blocked: the widget still works, it just loads each time.
  }
}
