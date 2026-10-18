import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type {
  EnvCredentials,
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
/** A User's profile, per username, from a `pair` stream or `users`. */
export const userKey = (username: string) => ['user', username] as const

/**
 * What an Environment lacks, by App: credentials or data sources it marks
 * unavailable. The credentials themselves are templates in `bootstrap.apps`.
 */
export const envCredentialsKey = (env: string) =>
  ['pairEnv', env, 'credentials'] as const

/** A chunk as it comes off the wire; only the fields this file reads. */
type WireChunk =
  | { facet: string; error: string }
  | { facet: 'users'; data: PairDeployment['users'] }
  | { facet: 'meta'; data: StreamMeta }
  | { app: string; facet: 'components'; data: Array<WireComponent> }
  | { env: string; facet: 'credentials'; data: EnvCredentials }
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
    if (row.deployedBy && users[row.deployedBy]) {
      named[row.deployedBy] = users[row.deployedBy]!
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
  stream: AsyncIterable<object>,
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
    else if (c.facet === 'credentials') {
      client.setQueryData<EnvCredentials>(envCredentialsKey(c.env), (old) =>
        keepCached ? { ...c.data, ...old } : { ...old, ...c.data },
      )
    } else if (c.facet === 'deployment') {
      put(
        pairFacetKey(c.app, c.env, 'deployment'),
        expandDeployment(c.data, components.get(c.app) ?? [], users, meta),
      )
    } else put(pairFacetKey(c.app, c.env, c.facet), c.data)
  }
  return failed
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
      const cached = () =>
        ctx.client.getQueryData<PairFacetData<TFacet>>(ctx.queryKey)
      // No abort signal: an unmount then does not cancel the load, so
      // StrictMode's remount reuses it instead of sending the pair again.
      const stream = await getTrpcFromMeta(ctx).pair.query({
        appSlug: app,
        envSlug: env,
      })
      const failed = await intoCache(ctx.client, stream)
      if (failed.has(facet)) throw new Error(`pair ${facet} unavailable`)
      return cached() ?? null
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
