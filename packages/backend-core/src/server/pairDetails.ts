import { splitId } from '../catalog/catalogRead'
import { ALL_ENVS } from '../catalog/catalogTypes'
import type {
  AppComponent,
  AppEnvFreshness,
  PairDeployment,
  PairDeployments,
} from '../catalog'
import type { ResourceJumpsData } from '../types'
import type { EhTrpcContext } from './ehTrpcContext'

/** One `slices` call takes at most this many Apps and this many Environments. */
export const MAX_SLICE_SLUGS = 50
/** One `users` call takes at most this many usernames. */
export const MAX_USERS = 100

/** A facet of one pair (App, Environment). */
export type PairFacet = 'jumps' | 'deployment' | 'changes' | 'workItems'
/** Everything a stream carries: the facets, and what their chunks share. */
export type StreamFacet = PairFacet | 'components' | 'users' | 'meta'

/** The pair's jumps, each URL template narrowed to the pair's Environment. */
export type PairJumps = ResourceJumpsData

/**
 * A Component as streamed, once per App. `pipelineUrl` is the URL most of its
 * Deployments' build and deploy links fit, with `{{id}}` where each row's id
 * goes.
 */
export type WireComponent = AppComponent

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
  /** How fresh this AppEnv is; absent when the Entity Provider wrote none. */
  freshness?: AppEnvFreshness
}

/**
 * One chunk of a pair-details stream, sent as soon as its source answers.
 * Pair-level chunks name an App and an Environment. A `components` chunk precedes an App's first `deployment`
 * chunk, and comes again when a Component gains its `pipelineUrl`; a `users`
 * chunk precedes the first row naming a User. A source
 * that fails sends `{facet, error}` for each facet it owns.
 */
export type PairChunk =
  | { app: string; env: string; facet: 'deployment'; data: WirePairDeployment }
  | { app: string; env: string; facet: 'jumps'; data: PairJumps }
  // Reserved; not emitted yet.
  | { app: string; env: string; facet: 'changes' | 'workItems'; data: unknown }
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

/** The value most of `values` hold. */
function mostCommon(values: Array<string>): string | undefined {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
}

/** What a stream has already sent, so it sends each part once. */
interface Sent {
  pairs: Set<string>
  /** The Apps whose Components went out. */
  apps: Set<string>
  /** `null`: the stream sends no profiles, its rows name Users by username. */
  users: Set<string> | null
  meta?: StreamMeta
}

/**
 * The deployment chunks of the pairs not sent yet, a pair's chunks together:
 * before its `deployment` chunk, the stream's `meta`, its App's `components`
 * and every new User it names (unless the stream sends no profiles), each
 * only the first time any pair needs it. A row's links are encoded against
 * its Component's `pipelineUrl`, which every read sees alike.
 */
function deploymentChunks(
  pairs: Array<Pair>,
  found: PairDeployments,
  components: Record<string, Array<AppComponent>>,
  sent: Sent,
): Array<Array<PairChunk>> {
  const byKey = new Map(found.pairs.map((p) => [keyOf(p), p]))
  const freshnessOf = new Map(
    (found.freshness ?? []).map(({ app, env, ...f }) => [
      keyOf({ app, env }),
      f,
    ]),
  )
  const observedAt = mostCommon(
    found.pairs.flatMap((p) =>
      p.rows.flatMap((r) => (r.health ? [r.health.observedAt] : [])),
    ),
  )
  // Once each: a pair two slices hold, or one slice lists twice (by its jumps
  // and by its Deployment), goes out once.
  const fresh = pairs.filter((p) => {
    if (sent.pairs.has(keyOf(p))) return false
    sent.pairs.add(keyOf(p))
    return true
  })
  return fresh.map(({ app, env }) => {
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
    const appComponents = components[app] ?? []
    if (appComponents.length > 0 && !sent.apps.has(app)) {
      sent.apps.add(app)
      out.push({ app, facet: 'components', data: appComponents })
    }
    const templates = new Map(appComponents.map((c) => [c.slug, c.pipelineUrl]))
    const run = sent.meta?.observedAt
    out.push({
      app,
      env,
      facet: 'deployment',
      data: {
        rows: (hit?.rows ?? []).map((row) => {
          const { buildUrl, deployUrl, health, ...rest } = row
          const template = templates.get(row.componentSlug)
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
        ...(freshnessOf.has(keyOf({ app, env })) && {
          freshness: freshnessOf.get(keyOf({ app, env })),
        }),
        ...(!freshnessOf.has(keyOf({ app, env })) &&
          freshnessOf.has(keyOf({ app, env: ALL_ENVS })) && {
            freshness: freshnessOf.get(keyOf({ app, env: ALL_ENVS })),
          }),
      },
    })
    return out
  })
}

const EMPTY: PairDeployments = { pairs: [] }

/**
 * The details of the pairs in scope: a chunk per pair-level facet per pair.
 * Credentials are not among them: `bootstrap` carries each App's, and each
 * Environment's `appOverride.unavailable`.
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
    | { appSlugs: Array<string>; envSlugs: Array<string>; except?: Pair }
    | { changed: Array<Pair> },
): AsyncGenerator<PairChunk> {
  const backend = ctx.companySpecificBackend
  const catalog = ctx.catalog
  const resourceJumps = backend.getResourceJumps()
  // `pair` names its own deployers; a slice sends usernames only, and the
  // client asks `users` for a profile when it shows one.
  const sent: Sent = {
    pairs: new Set(),
    apps: new Set(),
    users: 'pair' in scope ? new Set() : null,
  }
  const read = (filter: {
    appSlugs?: Array<string>
    envSlugs?: Array<string>
  }) => (catalog ? catalog.getPairDeployments(filter) : Promise.resolve(EMPTY))
  // One read per stream, beside the pair reads: each pair waits for it.
  const componentsOf = (filter: { appSlugs?: Array<string> }) => {
    const found = catalog ? catalog.getComponents(filter) : Promise.resolve({})
    // Awaited by every load; a stream with nothing to load leaves it unread.
    found.catch(() => undefined)
    return found
  }

  if ('pair' in scope) {
    const { app, env } = scope.pair
    const components = componentsOf({ appSlugs: [app] })
    yield* streamSources([
      {
        facets: ['jumps'],
        chunks: whole(
          resourceJumps.then((jumps) => [jumpsOf(scope.pair, jumps)]),
        ),
      },
      {
        facets: ['deployment'],
        chunks: perPair([scope.pair], 'deployment', async (p) =>
          deploymentChunks(
            [p],
            await read({ appSlugs: [app], envSlugs: [env] }),
            await components,
            sent,
          ).flat(),
        ),
      },
    ])
    return
  }

  if ('changed' in scope) {
    // Like a slice, but of exactly these pairs: one read per App, and a pair
    // with nothing deployed any more goes out with no rows.
    const envsOf = new Map<string, Array<string>>()
    for (const { app, env } of scope.changed) {
      envsOf.set(app, [...(envsOf.get(app) ?? []), env])
    }
    const components = componentsOf({ appSlugs: [...envsOf.keys()] })
    yield* streamSources([
      {
        facets: ['deployment'],
        chunks: asReady(
          [...envsOf.keys()].map((app) => ({ app })),
          'deployment',
          async ({ app }) => {
            const envs = envsOf.get(app)!
            return deploymentChunks(
              envs.map((env) => ({ app, env })),
              await read({ appSlugs: [app], envSlugs: envs }),
              await components,
              sent,
            ).flat()
          },
        ),
      },
    ])
    return
  }

  const { appSlugs, envSlugs, except } = scope
  // A horizontal slice holds any App: then every App's Components.
  const components = componentsOf(envSlugs.length > 0 ? {} : { appSlugs })
  // The horizontal slices the config alone names: an App with jumps has them
  // on every Environment, since every jump has a default URL. Without the
  // jumps, the slices are what the catalog knows.
  const configured = resourceJumps.then(
    (jumps) => ({
      apps: [...new Set(jumps.resourceJumps.map((rj) => appOfJump(rj.slug)))],
      envs: new Set(jumps.envs.map((e) => e.slug)),
    }),
    () => ({ apps: [], envs: new Set<string>() }),
  )
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
        ? await configured.then(({ apps, envs }) =>
            envs.has(slice.env)
              ? apps.map((app) => ({ app, env: slice.env }))
              : [],
          )
        : []
    return [...fromConfig, ...found.pairs].filter(
      (p) => !except || keyOf(p) !== keyOf(except),
    )
  }

  yield* streamSources([
    {
      facets: ['deployment'],
      chunks: asReady(slices, 'deployment', async (s) => {
        const found = await reads.get(s)!
        return deploymentChunks(
          await pairsOf(s, found),
          found,
          await components,
          sent,
        ).flat()
      }),
    },
  ])
}
