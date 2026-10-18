import type { PairDeployment, PairDeployments } from '../catalog'
import type {
  EhAppFacility,
  EhBackendAppInput,
  ResourceJumpsData,
} from '../types'
import type { EhTrpcContext } from './ehTrpcContext'

/** One `slices` call takes at most this many Apps and this many Environments. */
export const MAX_SLICE_SLUGS = 50
/** One `users` call takes at most this many usernames. */
export const MAX_USERS = 100

/** A facet of one pair (App, Environment). */
export type PairFacet = 'jumps' | 'deployment' | 'changes' | 'workItems'
/** A facet of one Environment, the same for every App the stream names there. */
export type EnvFacet = 'credentials'
/** Everything a stream carries: the facets, and what their chunks share. */
export type StreamFacet = PairFacet | EnvFacet | 'components' | 'users' | 'meta'

/** The pair's jumps, each URL template narrowed to the pair's Environment. */
export type PairJumps = ResourceJumpsData

/**
 * What an Environment lacks, by App: the in-scope Apps whose credentials or
 * data sources it marks unavailable, and which of the two. Only Apps that
 * have them in `bootstrap.apps`, where their templates come from.
 */
export type EnvCredentials = Record<string, Array<EhAppFacility>>

/**
 * A Component as streamed, once per App. `pipelineUrl` is the URL its rows'
 * build and deploy links share, with `{{id}}` where each row's id goes.
 */
export interface WireComponent {
  slug: string
  displayName: string
  lead?: true
  pipelineUrl?: string
}

type DeploymentRow = PairDeployment['rows'][number]
type Health = NonNullable<DeploymentRow['health']>
/**
 * A Health as streamed: `observedAt` only when it is not the stream's
 * `meta.observedAt`, `detail` only when the state is not healthy.
 */
export type WireHealth = Omit<Health, 'observedAt'> & { observedAt?: string }
/**
 * A row as streamed: a link that fits its Component's `pipelineUrl` is sent
 * as the id alone; one that does not stays a full URL.
 */
export type WireDeploymentRow = Omit<
  DeploymentRow,
  'buildUrl' | 'deployUrl' | 'health'
> & {
  buildUrl?: string
  deployUrl?: string
  buildPipelineId?: string
  deployPipelineId?: string
  health?: WireHealth
}

/** What a stream's rows share, sent once before the first row that needs it. */
export interface StreamMeta {
  /** When the Health checks ran: a row's Health observed then omits it. */
  observedAt?: string
}

/** A pair's deployment as streamed; Components and Users come in their own chunks. */
export interface WirePairDeployment {
  rows: Array<WireDeploymentRow>
}

/**
 * One chunk of a pair-details stream, sent as soon as its source answers.
 * Pair-level chunks name an App and an Environment, env-level ones only the
 * Environment. A `components` chunk precedes an App's first `deployment`
 * chunk, and a `users` chunk precedes the first row naming a User. A source
 * that fails sends `{facet, error}` for each facet it owns.
 */
export type PairChunk =
  | { app: string; env: string; facet: 'deployment'; data: WirePairDeployment }
  | { app: string; env: string; facet: 'jumps'; data: PairJumps }
  // Reserved; not emitted yet.
  | { app: string; env: string; facet: 'changes' | 'workItems'; data: unknown }
  // Only for an Environment that lacks some in-scope App's credentials.
  | { env: string; facet: 'credentials'; data: EnvCredentials }
  | { app: string; facet: 'components'; data: Array<WireComponent> }
  | { facet: 'users'; data: PairDeployment['users'] }
  | { facet: 'meta'; data: StreamMeta }
  // A pair's facet, or a whole source's facets, that failed.
  | { app?: string; env?: string; facet: StreamFacet; error: string }

interface Pair {
  app: string
  env: string
}

/** The App part of a jump slug: `orders@shipments` belongs to `orders`. */
const appOfJump = (jumpSlug: string) => jumpSlug.split('@')[0]!
const keyOf = (p: Pair) => `${p.app}\u0000${p.env}`

/** A source of chunks, and the facets it owns should it fail. */
export interface Source {
  facets: Array<StreamFacet>
  chunks: AsyncIterable<PairChunk>
}

/** A source that answers all at once. */
async function* whole(chunks: Promise<Array<PairChunk>>) {
  yield* await chunks
}

/** Each value the moment its own promise settles, in completion order. */
async function* asCompleted<T>(promises: Array<Promise<T>>): AsyncGenerator<T> {
  const pending = new Map(
    promises.map((p, i) => [i, p.then((v) => ({ i, v }))]),
  )
  while (pending.size > 0) {
    const { i, v } = await Promise.race(pending.values())
    pending.delete(i)
    yield v
  }
}

/**
 * Each item's chunks the moment its own load settles, never after the
 * others. An item whose load fails gets an error chunk for `facet`, naming
 * what the item names; the other items still arrive.
 */
function asReady<T extends { app?: string; env?: string }>(
  items: Array<T>,
  facet: PairFacet,
  load: (item: T) => Promise<Array<PairChunk>>,
): AsyncIterable<PairChunk> {
  return (async function* () {
    for await (const chunks of asCompleted(
      items.map((item) =>
        load(item).catch((e: unknown): Array<PairChunk> => {
          console.error('[pairDetails] load failed', facet, item, e)
          return [{ ...item, facet, error: 'source failed' }]
        }),
      ),
    ))
      yield* chunks
  })()
}

/**
 * A source that answers per pair: each pair's chunks are sent the moment its
 * own data is ready, never after the whole slice. A pair whose load fails
 * gets an error chunk for `facet`; the other pairs still arrive.
 */
export function perPair(
  pairs: Array<Pair>,
  facet: PairFacet,
  load: (pair: Pair) => Promise<Array<PairChunk>>,
): AsyncIterable<PairChunk> {
  return asReady(pairs, facet, load)
}

/**
 * Every source's chunks interleaved as each arrives. A source that fails
 * yields an error chunk per facet it owns; the others still arrive.
 */
export async function* streamSources(
  sources: Array<Source>,
): AsyncGenerator<PairChunk> {
  type Next = { i: number; r?: IteratorResult<PairChunk>; failed?: unknown }
  const its = sources.map((s) => s.chunks[Symbol.asyncIterator]())
  const next = (i: number): Promise<Next> =>
    its[i]!.next().then(
      (r) => ({ i, r }),
      (failed: unknown) => ({ i, failed: failed ?? 'failed' }),
    )
  const pending = new Map(its.map((_, i) => [i, next(i)]))
  while (pending.size > 0) {
    const { i, r, failed } = await Promise.race(pending.values())
    if (failed !== undefined) {
      pending.delete(i)
      console.error('[pairDetails] source failed', sources[i]!.facets, failed)
      for (const facet of sources[i]!.facets) {
        yield { facet, error: 'source failed' }
      }
    } else if (r!.done) pending.delete(i)
    else {
      pending.set(i, next(i))
      yield r!.value
    }
  }
}

function jumpsOf({ app, env }: Pair, jumps: ResourceJumpsData): PairChunk {
  const resourceJumps = jumps.resourceJumps
    .filter((rj) => appOfJump(rj.slug) === app)
    .map((rj) => {
      const { overrides, templateParams } = rj.urlTemplate
      return {
        ...rj,
        urlTemplate: {
          default: rj.urlTemplate.default,
          ...(overrides?.[env] !== undefined && {
            overrides: { [env]: overrides[env] },
          }),
          ...(templateParams?.[env] !== undefined && {
            templateParams: { [env]: templateParams[env] },
          }),
        },
      }
    })
  const used = new Set(
    resourceJumps.flatMap((rj) => rj.lateResolvableParamSlugs ?? []),
  )
  const params = new Map(jumps.lateResolvableParams.map((p) => [p.slug, p]))
  const envInfo = jumps.envs.find((e) => e.slug === env)
  return {
    app,
    env,
    facet: 'jumps',
    data: {
      resourceJumps,
      envs: envInfo ? [envInfo] : [],
      lateResolvableParams: [...used].flatMap((s) => params.get(s) ?? []),
    },
  }
}

/**
 * A `credentials` chunk per Environment that lacks some of the pairs' Apps'
 * credentials or data sources; none where it lacks nothing they have.
 */
function credentialChunks(
  pairs: Array<Pair>,
  apps: Record<string, EhBackendAppInput>,
  unavailableOf: (env: string) => Array<EhAppFacility>,
): Array<PairChunk> {
  const has = (app: string, facility: EhAppFacility) =>
    ((facility === 'credentials'
      ? apps[app]?.ui?.credentials
      : apps[app]?.dataSources
    )?.length ?? 0) > 0
  const byEnv = new Map<string, EnvCredentials>()
  for (const { app, env } of pairs) {
    const lacks = unavailableOf(env).filter((f) => has(app, f))
    if (lacks.length > 0) byEnv.set(env, { ...byEnv.get(env), [app]: lacks })
  }
  return [...byEnv].map(([env, data]) => ({ env, facet: 'credentials', data }))
}

/** A URL ending in an id: the URL with `{{id}}` there, and the id. */
function splitId(url: string): [template: string, id: string] | undefined {
  const m = /^(.*?)(\d+)$/.exec(url)
  return m ? [`${m[1]}{{id}}`, m[2]!] : undefined
}

/** Per Component, the `pipelineUrl` most of its rows' links fit. */
function pipelineUrls(rows: Array<DeploymentRow>): Map<string, string> {
  const counts = new Map<string, Map<string, number>>()
  for (const r of rows) {
    for (const url of [r.buildUrl, r.deployUrl]) {
      const split = url ? splitId(url) : undefined
      if (!split) continue
      const byTemplate = counts.get(r.componentSlug) ?? new Map()
      counts.set(r.componentSlug, byTemplate)
      byTemplate.set(split[0], (byTemplate.get(split[0]) ?? 0) + 1)
    }
  }
  return new Map(
    [...counts].map(([slug, byTemplate]) => [
      slug,
      [...byTemplate].sort((a, b) => b[1] - a[1])[0]![0],
    ]),
  )
}

/** The value most of `values` hold. */
function mostCommon(values: Array<string>): string | undefined {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
}

/** What a stream has already sent, so it sends each part once. */
interface Sent {
  pairs: Set<string>
  /** Per App whose Components went out, each Component's `pipelineUrl`. */
  apps: Map<string, Map<string, string>>
  /** `null`: the stream sends no profiles, its rows name Users by username. */
  users: Set<string> | null
  meta?: StreamMeta
}

/**
 * The deployment chunks of the pairs not sent yet, a pair's chunks together:
 * before its `deployment` chunk, the stream's `meta`, its App's `components`
 * and every new User it names (unless the stream sends no profiles), each
 * only the first time any pair needs it. A row's links are encoded against
 * the `pipelineUrl` its Component went out with.
 */
function deploymentChunks(
  pairs: Array<Pair>,
  found: PairDeployments,
  sent: Sent,
): Array<Array<PairChunk>> {
  const byKey = new Map(found.pairs.map((p) => [keyOf(p), p]))
  const urls = pipelineUrls(found.pairs.flatMap((p) => p.rows))
  const observedAt = mostCommon(
    found.pairs.flatMap((p) =>
      p.rows.flatMap((r) => (r.health ? [r.health.observedAt] : [])),
    ),
  )
  const fresh = pairs.filter((p) => !sent.pairs.has(keyOf(p)))
  return fresh.map(({ app, env }) => {
    sent.pairs.add(keyOf({ app, env }))
    const out: Array<PairChunk> = []
    const hit = byKey.get(keyOf({ app, env }))
    if (!sent.meta && hit?.rows.some((r) => r.health)) {
      sent.meta = { ...(observedAt && { observedAt }) }
      out.push({ facet: 'meta', data: sent.meta })
    }
    const users: PairDeployment['users'] = {}
    for (const [username, user] of Object.entries(hit?.users ?? {})) {
      if (sent.users && !sent.users.has(username)) {
        sent.users.add(username)
        users[username] = user
      }
    }
    if (Object.keys(users).length > 0) out.push({ facet: 'users', data: users })
    if (!sent.apps.has(app)) {
      const components = found.components[app] ?? []
      const templates = new Map(
        components.flatMap((c) => {
          const url = urls.get(c.slug)
          return url ? [[c.slug, url] as const] : []
        }),
      )
      sent.apps.set(app, templates)
      if (components.length > 0) {
        out.push({
          app,
          facet: 'components',
          data: components.map((c) => {
            const pipelineUrl = templates.get(c.slug)
            return pipelineUrl ? { ...c, pipelineUrl } : c
          }),
        })
      }
    }
    const run = sent.meta?.observedAt
    out.push({
      app,
      env,
      facet: 'deployment',
      data: {
        rows: (hit?.rows ?? []).map((row) => {
          const { buildUrl, deployUrl, health, ...rest } = row
          const template = sent.apps.get(app)?.get(row.componentSlug)
          const link = (
            url: string | undefined,
            idKey: string,
            urlKey: string,
          ) => {
            if (!url) return {}
            const split = splitId(url)
            return split && split[0] === template
              ? { [idKey]: split[1] }
              : { [urlKey]: url }
          }
          return {
            ...rest,
            ...link(buildUrl, 'buildPipelineId', 'buildUrl'),
            ...link(deployUrl, 'deployPipelineId', 'deployUrl'),
            ...(health && {
              health: {
                state: health.state,
                checker: health.checker,
                ...(health.observedAt !== run && {
                  observedAt: health.observedAt,
                }),
                ...(health.state !== 'healthy' &&
                  health.detail !== undefined && { detail: health.detail }),
              },
            }),
          }
        }),
      },
    })
    return out
  })
}

const EMPTY: PairDeployments = { components: {}, pairs: [] }

/**
 * The details of the pairs in scope: a chunk per pair-level facet per pair,
 * a `credentials` chunk per Environment that lacks some.
 *
 * `pair` names one pair, and also gets its jumps. Otherwise the scope is the
 * union of the slices: for each of `envSlugs`, every App that has a jump or a
 * Deployment there; for each of `appSlugs`, every Environment it has a
 * Deployment on. Slices carry no jumps: `bootstrap` builds jump URLs.
 */
export async function* pairDetails(
  ctx: EhTrpcContext,
  scope:
    | { pair: Pair }
    | { appSlugs: Array<string>; envSlugs: Array<string>; except?: Pair },
): AsyncGenerator<PairChunk> {
  const backend = ctx.companySpecificBackend
  const catalog = ctx.catalog
  const config = Promise.all([
    backend.getResourceJumps(),
    backend.getBootstrapData(),
  ])
  const credentials = (pairs: Array<Pair>) =>
    config.then(([, bootstrap]) =>
      credentialChunks(
        pairs,
        bootstrap.apps as Record<string, EhBackendAppInput>,
        (env) => bootstrap.envs[env]?.appOverride?.unavailable ?? [],
      ),
    )
  // `pair` names its own deployers; a slice sends usernames only, and the
  // client asks `users` for a profile when it shows one.
  const sent: Sent = {
    pairs: new Set(),
    apps: new Map(),
    users: 'pair' in scope ? new Set() : null,
  }
  const read = (filter: {
    appSlugs?: Array<string>
    envSlugs?: Array<string>
  }) => (catalog ? catalog.getPairDeployments(filter) : Promise.resolve(EMPTY))

  if ('pair' in scope) {
    const { app, env } = scope.pair
    yield* streamSources([
      {
        facets: ['jumps'],
        chunks: whole(config.then(([jumps]) => [jumpsOf(scope.pair, jumps)])),
      },
      { facets: ['credentials'], chunks: whole(credentials([scope.pair])) },
      {
        facets: ['deployment'],
        chunks: perPair([scope.pair], 'deployment', async (p) =>
          deploymentChunks(
            [p],
            await read({ appSlugs: [app], envSlugs: [env] }),
            sent,
          ).flat(),
        ),
      },
    ])
    return
  }

  const { appSlugs, envSlugs, except } = scope
  // The horizontal slices the config alone names: an App with jumps has them
  // on every Environment, since every jump has a default URL.
  const configured = config.then(([jumps]) => ({
    apps: [...new Set(jumps.resourceJumps.map((rj) => appOfJump(rj.slug)))],
    envs: new Set(jumps.envs.map((e) => e.slug)),
  }))
  // One read per slice, each answering on its own: a pair is sent as soon as
  // the first slice holding it is read.
  const slices: Array<{ app: string } | { env: string }> = [
    ...appSlugs.map((app) => ({ app })),
    ...envSlugs.map((env) => ({ env })),
  ]
  const reads = new Map(
    slices.map((s) => [
      s,
      read('app' in s ? { appSlugs: [s.app] } : { envSlugs: [s.env] }),
    ]),
  )
  /** A slice's pairs: what its read found, and on an Environment its jumps. */
  const pairsOf = async (
    slice: (typeof slices)[number],
    found: PairDeployments,
  ): Promise<Array<Pair>> => {
    const fromConfig =
      'env' in slice
        ? await configured.then(
            ({ apps, envs }) =>
              envs.has(slice.env)
                ? apps.map((app) => ({ app, env: slice.env }))
                : [],
            () => [],
          )
        : []
    return [...fromConfig, ...found.pairs].filter(
      (p) => !except || keyOf(p) !== keyOf(except),
    )
  }

  yield* streamSources([
    {
      // Each source fails alone: without the catalog, the scope is what the
      // config knows.
      facets: ['credentials'],
      chunks: whole(
        Promise.all(
          slices.map(async (s) =>
            pairsOf(s, await reads.get(s)!.catch(() => EMPTY)),
          ),
        ).then((all) => credentials(uniquePairs(all.flat()))),
      ),
    },
    {
      facets: ['deployment'],
      chunks: asReady(slices, 'deployment', async (s) => {
        const found = await reads.get(s)!
        return deploymentChunks(await pairsOf(s, found), found, sent).flat()
      }),
    },
  ])
}

function uniquePairs(pairs: Array<Pair>): Array<Pair> {
  return [...new Map(pairs.map((p) => [keyOf(p), p])).values()]
}
