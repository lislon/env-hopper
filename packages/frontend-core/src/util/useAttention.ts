import { useSyncExternalStore } from 'react'

/** No activity for this long: the User is idle, and on-screen checks pause. */
export const IDLE_MS = 2 * 60_000

const ACTIVITY = [
  'mousemove',
  'pointerdown',
  'keydown',
  'scroll',
  'wheel',
  'focus',
  'touchstart',
] as const

let lastActivity = Date.now()
let active = true
let idleTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

const visible = () =>
  typeof document === 'undefined' || document.visibilityState !== 'hidden'

function set(next: boolean) {
  if (next === active) return
  active = next
  for (const l of listeners) l()
}

function armIdle() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => set(false), IDLE_MS)
}

function onActivity() {
  lastActivity = Date.now()
  armIdle()
  set(visible())
}

function onVisibility() {
  if (visible()) onActivity()
  else set(false)
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    for (const e of ACTIVITY)
      window.addEventListener(e, onActivity, { passive: true, capture: true })
    document.addEventListener('visibilitychange', onVisibility)
    armIdle()
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      for (const e of ACTIVITY)
        window.removeEventListener(e, onActivity, { capture: true })
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(idleTimer)
    }
  }
}

/** When the User last moved, scrolled, typed or focused the page. */
export const lastActivityAt = () => lastActivity

/**
 * Whether someone is looking: the page is visible and there was activity
 * (mouse move, scroll, key, focus, touch) within `IDLE_MS`.
 */
export function useAttention(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => true,
  )
}
