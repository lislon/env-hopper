import { useEffect, useRef, useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import { applyPush } from './pairDetails'
import { slicesOfInterest } from './usePreloadSlices'

/** `pairsWatch` takes at most this many of each (backend-core's cap). */
const MAX_SLUGS = 50

/**
 * Keeps the cached pair details current: subscribes to `pairsWatch` for the
 * slices the page preloaded plus every pair opened since, and merges each push
 * into the pair cache. The scope only grows within a page load; when it does,
 * the subscription is replaced, handing over the last event id so the server
 * resends the scope only if a change was missed meanwhile.
 *
 * ponytail: a change committed between the slices read and the subscription
 * starting is missed until the next change of that pair; close it by sending
 * the change id with the slices, once that costs less than the gap does.
 */
export function usePairsWatch(
  queryClient: QueryClient,
  trpcClient: TRPCClient<TRPCRouter>,
  { appSlug, envSlug }: { appSlug?: string; envSlug?: string },
) {
  // Grows only: the interests at the first render, then each pair opened.
  const [seen] = useState(() => {
    const interests = slicesOfInterest({ appSlug, envSlug })
    return {
      apps: new Set(interests.appSlugs),
      envs: new Set(interests.envSlugs),
    }
  })
  if (appSlug) seen.apps.add(appSlug)
  if (envSlug) seen.envs.add(envSlug)
  const scope =
    seen.apps.size + seen.envs.size > 0
      ? JSON.stringify({
          appSlugs: [...seen.apps].slice(-MAX_SLUGS),
          envSlugs: [...seen.envs].slice(-MAX_SLUGS),
        })
      : ''
  const lastEventId = useRef<string | undefined>(undefined)

  useEffect(() => {
    // No EventSource (an old browser, a test DOM): the cache simply is not
    // pushed to; nothing else depends on it.
    if (!scope || typeof EventSource === 'undefined') return
    const input = JSON.parse(scope) as {
      appSlugs: Array<string>
      envSlugs: Array<string>
    }
    const sub = trpcClient.pairsWatch.subscribe(
      { ...input, lastEventId: lastEventId.current },
      {
        onData: (event) => {
          lastEventId.current = event.id
          void applyPush(queryClient, event.data)
        },
        onError: (e) => console.warn('[pairsWatch] stopped', e),
      },
    )
    return () => sub.unsubscribe()
  }, [scope, queryClient, trpcClient])
}
