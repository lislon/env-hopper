import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type {
  PairDeployment,
  PairJumps,
  StreamMeta,
  TRPCRouter,
  WireComponent,
  WirePairDeployment,
} from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'

/** What the cache holds per pair facet: the deployment expanded, as the UI reads it. */
interface PairFacets {
  deployment: PairDeployment
  jumps: PairJumps
  changes: unknown
  workItems: unknown
}
export type PairFacetName = keyof PairFacets
export type PairFacetData<TFacet extends PairFacetName> = PairFacets[TFacet]

/** The cache holds pair details per (App, Environment, facet). */
export const pairFacetKey = (app: string, env: string, facet: PairFacetName) =>
  ['pair', app, env, facet] as const
/** A change request's details, per App, Component and id. */
export const changeRequestKey = (
  appSlug: string,
  componentSlug: string,
  id: string,
) => ['changeRequest', appSlug, componentSlug, id] as const
/** A User's profile, per username, from a `pair` stream or `users`. */
export const userKey = (username: string) => ['user', username] as const

/** A chunk as it comes off the wire; only the fields this file reads. */
type WireChunk =
  | { facet: string; error: string }
  | { facet: 'users'; data: PairDeployment['users'] }
  | { facet: 'meta'; data: StreamMeta }
  | { app: string; facet: 'components'; data: Array<WireComponent> }
  | { app: string; env: string; facet: 'deployment'; data: WirePairDeployment }
  | {
      app: string
      env: string
      facet: Exclude<PairFacetName, 'deployment'>
      data?: unknown
    }

/** A pair's deployment as the UI reads it, from what the stream sent before it. */
export function expandDeployment(
  wire: WirePairDeployment,
  components: Array<WireComponent>,
  users: PairDeployment['users'],
  meta: StreamMeta = {},
): PairDeployment {
  const pipelineUrl = new Map(components.map((c) => [c.slug, c.pipelineUrl]))
  const named: PairDeployment['users'] = {}
  const rows = wire.rows.map((row) => {
    const { buildPipelineId, deployPipelineId, health, ...rest } = row
    const url = (id: string | undefined) =>
      id === undefined
        ? undefined
        : pipelineUrl.get(row.componentSlug)?.replace('{{id}}', id)
    const buildUrl = rest.buildUrl ?? url(buildPipelineId)
    const deployUrl = rest.deployUrl ?? url(deployPipelineId)
    for (const u of [row.deployedBy, row.attempt?.by]) {
      if (u && users[u]) named[u] = users[u]
    }
    const observedAt = health?.observedAt ?? meta.observedAt
    return {
      ...rest,
      ...(buildUrl && { buildUrl }),
      ...(deployUrl && { deployUrl }),
      ...(health && { health: { ...health, observedAt: observedAt ?? '' } }),
    }
  })
  return {
    components: components.map(({ pipelineUrl: _, ...c }) => c),
    users: named,
    rows,
  }
}

/**
 * Writes a stream into the cache as it arrives. `keepCached` leaves a pair
 * facet already cached as it is: a slice never overwrites a fresher `pair`.
 * Returns the facets a source failed to send; nothing is cached for them.
 */
async function intoCache(
  client: QueryClient,
  stream: AsyncIterable<object> | Iterable<object>,
  {
    signal,
    keepCached = false,
  }: { signal?: AbortSignal; keepCached?: boolean } = {},
): Promise<Set<string>> {
  const failed = new Set<string>()
  const components = new Map<string, Array<WireComponent>>()
  const users: PairDeployment['users'] = {}
  let meta: StreamMeta = {}
  const put = (key: ReturnType<typeof pairFacetKey>, data: unknown) => {
    if (keepCached && client.getQueryData(key) !== undefined) return
    client.setQueryData(key, data)
  }
  for await (const chunk of stream) {
    if (signal?.aborted) break
    const c = chunk as WireChunk
    if ('error' in c) failed.add(c.facet)
    else if (c.facet === 'users') {
      Object.assign(users, c.data)
      for (const [name, profile] of Object.entries(c.data)) {
        client.setQueryData(userKey(name), profile)
      }
    } else if (c.facet === 'meta') meta = c.data
    else if (c.facet === 'components') components.set(c.app, c.data)
    else if (c.facet === 'deployment') {
      put(
        pairFacetKey(c.app, c.env, 'deployment'),
        expandDeployment(c.data, components.get(c.app) ?? [], users, meta),
      )
    } else put(pairFacetKey(c.app, c.env, c.facet), c.data)
  }
  return failed
}

/** How long a `pair` load may wait for its facet before it counts as failed. */
const PAIR_FACET_TIMEOUT_MS = 10_000
/** While a pair facet stays failed, it is asked for again this often. */
const FAILED_RETRY_MS = 30_000
/** `value` for a failed query, `false` for any other. */
const failedOnly =
  <T>(value: T) =>
  (q: { state: { status: string } }) =>
    q.state.status === 'error' ? value : false

/**
 * One facet of a pair. A pair already in the cache, from `pair` or from a
 * slice, is never fetched again; otherwise its `pair` stream fills every
 * facet, each as it arrives. A load whose facet has not arrived within
 * `PAIR_FACET_TIMEOUT_MS` fails, and a failed facet keeps being retried.
 */
export function pairFacetQuery<TFacet extends PairFacetName>(
  app: string,
  env: string,
  facet: TFacet,
) {
  return queryOptions({
    queryKey: pairFacetKey(app, env, facet),
    // Never refetched when successful: `pairsWatch` pushes every change (see `usePairsWatch`).
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: failedOnly(true),
    refetchInterval: failedOnly(FAILED_RETRY_MS),
    queryFn: async (ctx): Promise<PairFacetData<TFacet>> => {
      const cached = () =>
        ctx.client.getQueryData<PairFacetData<TFacet>>(ctx.queryKey)
      // No unmount signal: an unmount then does not cancel the load, so
      // StrictMode's remount reuses it instead of sending the pair again.
      // Only the timeout aborts it, and only before its facet arrived.
      const abort = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined
      const timedOut = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          if (cached() !== undefined) return
          abort.abort()
          reject(
            new Error(`no ${facet} within ${PAIR_FACET_TIMEOUT_MS / 1000} s`),
          )
        }, PAIR_FACET_TIMEOUT_MS)
      })
      try {
        const load = (async () => {
          const stream = await getTrpcFromMeta(ctx).pair.query(
            { appSlug: app, envSlug: env },
            { signal: abort.signal },
          )
          return intoCache(ctx.client, stream, { signal: abort.signal })
        })()
        // Aborted by the timeout, it rejects after the race is decided.
        load.catch(() => undefined)
        const failed = await Promise.race([load, timedOut])
        if (failed.has(facet)) throw new Error(`the ${facet} source failed`)
      } finally {
        clearTimeout(timer)
      }
      const data = cached()
      if (data === undefined) throw new Error(`the stream sent no ${facet}`)
      return data
    },
  })
}

/** Loads every pair of the slices into the cache, never over a cached one. */
export async function loadSlices(
  client: QueryClient,
  trpc: TRPCClient<TRPCRouter>,
  input: {
    appSlugs: Array<string>
    envSlugs: Array<string>
    exceptPair?: { appSlug: string; envSlug: string }
  },
  signal?: AbortSignal,
) {
  await intoCache(client, await trpc.slices.query(input, { signal }), {
    signal,
    keepCached: true,
  })
}

/**
 * Merges what `pairsWatch` pushed into the cache: it is newer than anything
 * cached, so it replaces each pair facet it carries.
 */
export async function applyPush(client: QueryClient, chunks: Array<object>) {
  await intoCache(client, chunks)
}

type Profile = PairDeployment['users'][string]
interface Waiter {
  resolve: (profile: Profile | null) => void
  reject: (e: unknown) => void
}
type Waiting = Map<string, Array<Waiter>>
/** The `users` cap (backend-core's `MAX_USERS`). */
const USERS_PER_CALL = 100

/** Per client, the usernames asked for in this tick and who waits for each. */
const waiting = new WeakMap<TRPCClient<TRPCRouter>, Waiting>()

/**
 * Every profile asked for in the same tick goes out in one `users` call (at
 * most 100 names a call); each asker gets its own, `null` when unknown.
 */
function askProfile(
  trpc: TRPCClient<TRPCRouter>,
  username: string,
): Promise<Profile | null> {
  let batch = waiting.get(trpc)
  if (!batch) {
    const thisTick: Waiting = new Map()
    batch = thisTick
    waiting.set(trpc, thisTick)
    setTimeout(() => {
      waiting.delete(trpc)
      const names = [...thisTick.keys()]
      for (let i = 0; i < names.length; i += USERS_PER_CALL) {
        const part = names.slice(i, i + USERS_PER_CALL)
        trpc.users.query({ usernames: part }).then(
          (found) => {
            for (const n of part)
              for (const w of thisTick.get(n)!) w.resolve(found[n] ?? null)
          },
          (e: unknown) => {
            for (const n of part) for (const w of thisTick.get(n)!) w.reject(e)
          },
        )
      }
    }, 0)
  }
  const forTick = batch
  return new Promise((resolve, reject) => {
    forTick.set(username, [
      ...(forTick.get(username) ?? []),
      { resolve, reject },
    ])
  })
}

/**
 * A User's profile, asked of `users` the first time something shows it and
 * kept per username; `null` for a User the catalog does not know.
 */
export function userQuery(username: string) {
  return queryOptions({
    queryKey: userKey(username),
    staleTime: Infinity,
    queryFn: (ctx): Promise<Profile | null> =>
      askProfile(getTrpcFromMeta(ctx), username),
  })
}

/**
 * A change request's description, asked of `changeRequestDetails` the first
 * time a dialog showing it opens, and kept: it rarely changes.
 */
export function changeRequestDetailsQuery(
  appSlug: string,
  componentSlug: string,
  id: string,
) {
  return queryOptions({
    queryKey: changeRequestKey(appSlug, componentSlug, id),
    staleTime: Infinity,
    retry: 1,
    queryFn: (ctx) =>
      getTrpcFromMeta(ctx).changeRequestDetails.query({
        appSlug,
        componentSlug,
        id,
      }),
  })
}
