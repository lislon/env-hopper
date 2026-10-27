import { useSyncExternalStore } from 'react'

/** How often relative times ("5 min ago") move: well under their minute. */
const TICK_MS = 15_000

const listeners = new Set<() => void>()
let now = Date.now()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!timer) {
    now = Date.now()
    timer = setInterval(() => {
      now = Date.now()
      for (const l of listeners) l()
    }, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

// Between subscribers no tick runs: a reading older than a tick is renewed.
const getSnapshot = () => {
  if (!timer && Date.now() - now >= TICK_MS) now = Date.now()
  return now
}

/**
 * The time every relative time on screen reads, from one shared ticker that
 * runs while anything reads it: two "ago"s on one line move together.
 */
export const useNow = () => useSyncExternalStore(subscribe, getSnapshot)
