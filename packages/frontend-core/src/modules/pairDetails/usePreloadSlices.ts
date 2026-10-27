import { useEffect, useRef } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import { LOCAL_STORAGE_KEY_RECENT_JUMPS } from '~/legacy/lib/local-storage-constants'
import { appSlugFromJumpSlug } from '~/util/route-utils'
import { loadSlices, pairFacetQuery } from './pairDetails'

const TOP = 10
const preloaded = new WeakSet<QueryClient>()

/**
 * The Apps and Environments the user is interested in: the open pair first,
 * then the local jump history, most recent first, at most 10 each.
 */
export function slicesOfInterest(
  current: { appSlug?: string; envSlug?: string },
  storage: Storage = localStorage,
): { appSlugs: Array<string>; envSlugs: Array<string> } {
  let history: Array<{ app?: unknown; env?: unknown }> = []
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(LOCAL_STORAGE_KEY_RECENT_JUMPS) ?? '[]',
    )
    if (Array.isArray(parsed)) history = parsed
  } catch {
    // Unreadable history: only the open pair counts.
  }
  const top = (list: Array<unknown>) =>
    [
      ...new Set(
        list.filter((s): s is string => typeof s === 'string' && s !== ''),
      ),
    ].slice(0, TOP)
  return {
    appSlugs: top(
      [current.appSlug, ...history.map((h) => h.app)].map((a) =>
        typeof a === 'string' ? appSlugFromJumpSlug(a) : a,
      ),
    ),
    envSlugs: top([current.envSlug, ...history.map((h) => h.env)]),
  }
}

/**
 * Once per page load, after the first render, loads the slices around the
 * user's interests into the pair cache. Nothing waits for it: it only changes
 * what is already cached when a pair is opened.
 */
export function usePreloadSlices(
  queryClient: QueryClient,
  trpcClient: TRPCClient<TRPCRouter>,
  { appSlug, envSlug }: { appSlug?: string; envSlug?: string },
) {
  // Only an unmount aborts a preload in flight; moving to another pair must
  // not, or the pair it would have brought is fetched on its own.
  const inFlight = useRef<AbortController | null>(null)
  useEffect(() => () => inFlight.current?.abort(), [])
  useEffect(() => {
    if (preloaded.has(queryClient)) return
    const input = slicesOfInterest({ appSlug, envSlug })
    if (input.appSlugs.length === 0 && input.envSlugs.length === 0) return
    // Marked when it runs, not when scheduled: StrictMode's double mount
    // cancels the first timer.
    const timer = setTimeout(() => {
      preloaded.add(queryClient)
      const abort = (inFlight.current = new AbortController())
      loadSlices(queryClient, trpcClient, input, abort.signal).catch(
        (e: unknown) => {
          if (abort.signal.aborted) {
            // Unmounted: the next mount tries again.
            preloaded.delete(queryClient)
            return
          }
          // A preload failure costs a round trip later, nothing else.
          console.warn('[slices] preload failed', e)
        },
      )
    }, 0)
    return () => clearTimeout(timer)
    // Once per page load: a later pair finds `preloaded` set.
  }, [queryClient, trpcClient, appSlug, envSlug])
}

/** The pair a deep link `/env/<env>/app/<app>/…` opens, if it is one. */
export function pairOfPath(
  pathname: string,
): { appSlug: string; envSlug: string } | undefined {
  const m = /^\/env\/([^/]+)\/app\/([^/]+)/.exec(pathname)
  if (!m) return undefined
  return {
    envSlug: decodeURIComponent(m[1]!),
    appSlug: appSlugFromJumpSlug(decodeURIComponent(m[2]!)),
  }
}

/**
 * On a deep link, before anything renders: the open pair's details through
 * `pair`, and in parallel the slices around the user's interests without
 * that pair. Both run beside `bootstrap`; neither waits for it.
 */
export function startPairDetails(
  queryClient: QueryClient,
  trpcClient: TRPCClient<TRPCRouter>,
  pathname: string,
) {
  const open = pairOfPath(pathname)
  if (!open) return
  void queryClient.prefetchQuery(
    pairFacetQuery(open.appSlug, open.envSlug, 'deployment'),
  )
  preloaded.add(queryClient)
  loadSlices(queryClient, trpcClient, {
    ...slicesOfInterest(open),
    exceptPair: open,
  }).catch((e: unknown) => {
    // A preload failure costs a round trip later, nothing else.
    console.warn('[slices] preload failed', e)
  })
}
