import type { PairDeployment, PairDeployments } from '../catalog'
import type {
  EhBackendAppInput,
  EhBackendCredentialInput,
  EhBackendDataSourceInput,
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

/** What the config holds for the App, minus what the Environment lacks. */
export interface PairCredentials {
  ui: Array<EhBackendCredentialInput>
  dataSources: Array<EhBackendDataSourceInput>
}

/** An Environment's credentials, by App: only the Apps that have some. */
export type EnvCredentials = Record<string, PairCredentials>

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
 * A source that answers per pair: each pair's chunks are sent the moment its
 * own data is ready, never after the whole slice. A pair whose load fails
 * gets an error chunk for `facet`; the other pairs still arrive.
 */
export function perPair(
  pairs: Array<Pair>,
  facet: PairFacet,
  load: (pair: Pair) => Promise<Array<PairChunk>>,
): AsyncIterable<PairChunk> {
  return (async function* () {
    for await (const chunks of asCompleted(
      pairs.map((p) =>
        load(p).catch((e: unknown): Array<PairChunk> => {
          console.error('[pairDetails] pair failed', facet, p, e)
          return [{ app: p.app, env: p.env, facet, error: 'source failed' }]
        }),
      ),
    ))
      yield* chunks
  })()
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

/** One `credentials` chunk per Environment, for the pairs' Apps there. */
function credentialChunks(
  pairs: Array<Pair>,
  apps: Record<string, EhBackendAppInput>,
  unavailableOf: (env: string) => ReadonlySet<string>,
): Array<PairChunk> {
  const byEnv = new Map<string, EnvCredentials>()
  for (const { app, env } of pairs) {
    const data = byEnv.get(env) ?? {}
    byEnv.set(env, data)
    const unavailable = unavailableOf(env)
    const source = apps[app]
    const ui = unavailable.has('credentials')
      ? []
      : (source?.ui?.credentials ?? [])
    const dataSources = unavailable.has('dataSources')
      ? []
      : (source?.dataSources ?? [])
    if (ui.length > 0 || dataSources.length > 0) {
      data[app] = { ui, dataSources }
    }
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

/** What a stream has already sent, so it sends each shared part once. */
interface Sent {
  apps: Set<string>
  /** `null`: the stream sends no profiles, its rows name Users by username. */
  users: Set<string> | null
  meta?: StreamMeta
}

/**
 * The deployment chunks of the pairs, a pair's chunks together: before its
 * `deployment` chunk, the stream's `meta`, its App's `components` and every
 * new User it names (unless the stream sends no profiles), each only the
 * first time any pair needs it.
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
  return pairs.map(({ app, env }) => {
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
    const components = found.components[app] ?? []
    if (!sent.apps.has(app) && components.length > 0) {
      sent.apps.add(app)
      out.push({
        app,
        facet: 'components',
        data: components.map((c) => {
          const pipelineUrl = urls.get(c.slug)
          return pipelineUrl ? { ...c, pipelineUrl } : c
        }),
      })
    }
    const run = sent.meta?.observedAt
    out.push({
      app,
      env,
      facet: 'deployment',
      data: {
        rows: (hit?.rows ?? []).map((row) => {
          const { buildUrl, deployUrl, health, ...rest } = row
          const template = urls.get(row.componentSlug)
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
 * a `credentials` chunk per Environment.
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
        (env) => new Set(bootstrap.envs[env]?.appOverride?.unavailable),
      ),
    )
  // `pair` names its own deployers; a slice sends usernames only, and the
  // client asks `users` for a profile when it shows one.
  const sent: Sent = {
    apps: new Set(),
    users: 'pair' in scope ? new Set() : null,
  }
  // The catalog answers a whole scope in one read; its pairs are sent as
  // separate chunks, a pair's shared parts first.
  const deployments = (
    pairs: Promise<Array<Pair>>,
    found: Promise<PairDeployments>,
  ) =>
    (async function* () {
      const [p, f] = await Promise.all([pairs, found])
      for (const chunks of deploymentChunks(p, f, sent)) yield* chunks
    })()

  if ('pair' in scope) {
    const pairs = [scope.pair]
    yield* streamSources([
      {
        facets: ['jumps'],
        chunks: whole(config.then(([jumps]) => [jumpsOf(scope.pair, jumps)])),
      },
      { facets: ['credentials'], chunks: whole(credentials(pairs)) },
      {
        facets: ['deployment'],
        chunks: deployments(
          Promise.resolve(pairs),
          catalog
            ? catalog.getPairDeployments({
                appSlugs: [scope.pair.app],
                envSlugs: [scope.pair.env],
              })
            : Promise.resolve(EMPTY),
        ),
      },
    ])
    return
  }

  const { appSlugs, envSlugs, except } = scope
  // Two reads, one per slice direction; a pair in both is listed twice.
  const deployed = catalog
    ? Promise.all([
        appSlugs.length > 0
          ? catalog.getPairDeployments({ appSlugs })
          : Promise.resolve(EMPTY),
        envSlugs.length > 0
          ? catalog.getPairDeployments({ envSlugs })
          : Promise.resolve(EMPTY),
      ]).then(([v, h]) => ({
        components: { ...h.components, ...v.components },
        pairs: [...v.pairs, ...h.pairs],
      }))
    : Promise.resolve(EMPTY)

  // The horizontal slices the config alone names: an App with jumps has them
  // on every Environment, since every jump has a default URL.
  const configPairs = config.then(([jumps]) => {
    const apps = new Set(jumps.resourceJumps.map((rj) => appOfJump(rj.slug)))
    const envs = new Set(jumps.envs.map((e) => e.slug))
    return envSlugs
      .filter((env) => envs.has(env))
      .flatMap((env) => [...apps].map((app) => ({ app, env })))
  })
  // Each source fails alone: without the other, its scope is what it knows.
  const inScope = ([pairs, found]: [Array<Pair>, PairDeployments]) =>
    uniquePairs([
      ...pairs,
      ...found.pairs.filter(
        (p) => appSlugs.includes(p.app) || envSlugs.includes(p.env),
      ),
    ]).filter((p) => !except || keyOf(p) !== keyOf(except))
  const deployedOrNone = deployed.catch(() => EMPTY)

  yield* streamSources([
    {
      facets: ['credentials'],
      chunks: whole(
        Promise.all([configPairs, deployedOrNone]).then((both) =>
          credentials(inScope(both)),
        ),
      ),
    },
    {
      facets: ['deployment'],
      chunks: deployments(
        Promise.all([configPairs.catch(() => []), deployed]).then(inScope),
        deployed,
      ),
    },
  ])
}

function uniquePairs(pairs: Array<Pair>): Array<Pair> {
  return [...new Map(pairs.map((p) => [keyOf(p), p])).values()]
}
