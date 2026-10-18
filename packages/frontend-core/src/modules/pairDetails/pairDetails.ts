import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'

type Stream = Awaited<ReturnType<TRPCClient<TRPCRouter>['pair']['query']>>
/** One facet of one pair, as it comes off the wire. */
export type WirePairChunk = Stream extends AsyncIterable<infer C> ? C : never
export type PairFacetName = WirePairChunk['facet']
export type PairFacetData<TFacet extends PairFacetName> = Extract<
  WirePairChunk,
  { facet: TFacet }
>['data']

/** The cache holds pair details per (App, Environment, facet). */
export const pairFacetKey = (app: string, env: string, facet: PairFacetName) =>
  ['pair', app, env, facet] as const

async function intoCache(
  client: QueryClient,
  stream: AsyncIterable<WirePairChunk>,
  signal?: AbortSignal,
) {
  for await (const c of stream) {
    if (signal?.aborted) break
    client.setQueryData(pairFacetKey(c.app, c.env, c.facet), c.data)
  }
}

/**
 * One facet of a pair. A pair already in the cache, from `pair` or from a
 * slice, is never fetched again; otherwise its `pair` stream fills every
 * facet, each as it arrives.
 */
export function pairFacetQuery<TFacet extends PairFacetName>(
  app: string,
  env: string,
  facet: TFacet,
) {
  return queryOptions({
    queryKey: pairFacetKey(app, env, facet),
    // ponytail: never refetched; pushed updates (`pairsWatch`) are the plan.
    staleTime: Infinity,
    queryFn: async (ctx): Promise<PairFacetData<TFacet> | null> => {
      // No abort signal: an unmount then does not cancel the load, so
      // StrictMode's remount reuses it instead of sending the pair again.
      const stream = await getTrpcFromMeta(ctx).pair.query({
        appSlug: app,
        envSlug: env,
      })
      await intoCache(ctx.client, stream)
      return (ctx.client.getQueryData(ctx.queryKey) ??
        null) as PairFacetData<TFacet> | null
    },
  })
}

/** Loads every pair of the slices into the cache. */
export async function loadSlices(
  client: QueryClient,
  trpc: TRPCClient<TRPCRouter>,
  input: { appSlugs: Array<string>; envSlugs: Array<string> },
  signal?: AbortSignal,
) {
  await intoCache(client, await trpc.slices.query(input, { signal }), signal)
}
