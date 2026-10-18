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

export type PairFacet =
  | 'jumps'
  | 'credentials'
  | 'deployment'
  | 'changes'
  | 'workItems'

/** The pair's jumps, each URL template narrowed to the pair's Environment. */
export type PairJumps = ResourceJumpsData

/** What the config holds for the App, minus what the Environment lacks. */
export interface PairCredentials {
  ui: Array<EhBackendCredentialInput>
  dataSources: Array<EhBackendDataSourceInput>
}

/** One facet of one pair (App, Environment), sent as soon as its source answers. */
export type PairChunk =
  | { app: string; env: string; facet: 'deployment'; data: PairDeployment }
  | { app: string; env: string; facet: 'jumps'; data: PairJumps }
  | { app: string; env: string; facet: 'credentials'; data: PairCredentials }
  // Reserved; not emitted yet.
  | { app: string; env: string; facet: 'changes' | 'workItems'; data: unknown }

interface Pair {
  app: string
  env: string
}

/** The App part of a jump slug: `orders@shipments` belongs to `orders`. */
const appOfJump = (jumpSlug: string) => jumpSlug.split('@')[0]!
const keyOf = (p: Pair) => `${p.app}\u0000${p.env}`

/**
 * Yields each source's chunks as soon as that source answers, fastest first.
 * ponytail: a failing source fails the whole stream; isolate per facet once a
 * slow external source (changes, Work Items) joins.
 */
async function* firstAnswered(
  sources: Array<Promise<Array<PairChunk>>>,
): AsyncGenerator<PairChunk> {
  const pending = new Map(
    sources.map((p, i) => [i, p.then((chunks) => ({ i, chunks }))]),
  )
  while (pending.size > 0) {
    const { i, chunks } = await Promise.race(pending.values())
    pending.delete(i)
    yield* chunks
  }
}

function configFacets(
  pairs: Array<Pair>,
  jumps: ResourceJumpsData,
  apps: Record<string, EhBackendAppInput>,
  unavailableOf: (env: string) => ReadonlySet<string>,
): Array<PairChunk> {
  const envOf = new Map(jumps.envs.map((e) => [e.slug, e]))
  const params = new Map(jumps.lateResolvableParams.map((p) => [p.slug, p]))
  return pairs.flatMap(({ app, env }): Array<PairChunk> => {
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
    const envInfo = envOf.get(env)
    const source = apps[app]
    const unavailable = unavailableOf(env)
    return [
      {
        app,
        env,
        facet: 'jumps',
        data: {
          resourceJumps,
          envs: envInfo ? [envInfo] : [],
          lateResolvableParams: [...used].flatMap((s) => params.get(s) ?? []),
        },
      },
      {
        app,
        env,
        facet: 'credentials',
        data: {
          ui: unavailable.has('credentials')
            ? []
            : (source?.ui?.credentials ?? []),
          dataSources: unavailable.has('dataSources')
            ? []
            : (source?.dataSources ?? []),
        },
      },
    ]
  })
}

function deploymentFacets(
  pairs: Array<Pair>,
  found: PairDeployments,
): Array<PairChunk> {
  const byKey = new Map(found.pairs.map((p) => [keyOf(p), p]))
  return pairs.map(({ app, env }) => {
    const hit = byKey.get(keyOf({ app, env }))
    return {
      app,
      env,
      facet: 'deployment',
      data: {
        components: found.components[app] ?? [],
        users: hit?.users ?? {},
        rows: hit?.rows ?? [],
      },
    }
  })
}

const EMPTY: PairDeployments = { components: {}, pairs: [] }

/**
 * The details of the pairs in scope, one chunk per facet per pair.
 *
 * `pair` names one pair. Otherwise the scope is the union of the slices: for
 * each of `envSlugs`, every App that has a jump or a Deployment there; for
 * each of `appSlugs`, every Environment it has a jump or a Deployment on.
 */
export async function* pairDetails(
  ctx: EhTrpcContext,
  scope: { pair: Pair } | { appSlugs: Array<string>; envSlugs: Array<string> },
): AsyncGenerator<PairChunk> {
  const backend = ctx.companySpecificBackend
  const catalog = ctx.catalog
  const config = Promise.all([
    backend.getResourceJumps(),
    backend.getBootstrapData(),
  ])

  if ('pair' in scope) {
    const pairs = [scope.pair]
    yield* firstAnswered([
      config.then(([jumps, bootstrap]) =>
        configFacets(
          pairs,
          jumps,
          bootstrap.apps as Record<string, EhBackendAppInput>,
          (env) => new Set(bootstrap.envs[env]?.appOverride?.unavailable),
        ),
      ),
      (catalog
        ? catalog.getPairDeployments({
            appSlugs: [scope.pair.app],
            envSlugs: [scope.pair.env],
          })
        : Promise.resolve(EMPTY)
      ).then((found) => deploymentFacets(pairs, found)),
    ])
    return
  }

  const { appSlugs, envSlugs } = scope
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

  // Pairs the config alone names: an App with jumps has them on every
  // Environment, since every jump has a default URL.
  const configPairs = config.then(([jumps]) => {
    const apps = new Set(jumps.resourceJumps.map((rj) => appOfJump(rj.slug)))
    const envs = jumps.envs.map((e) => e.slug)
    return uniquePairs([
      ...envSlugs
        .filter((env) => envs.includes(env))
        .flatMap((env) => [...apps].map((app) => ({ app, env }))),
      ...appSlugs
        .filter((app) => apps.has(app))
        .flatMap((app) => envs.map((env) => ({ app, env }))),
    ])
  })

  yield* firstAnswered([
    Promise.all([config, configPairs]).then(([[jumps, bootstrap], pairs]) =>
      configFacets(
        pairs,
        jumps,
        bootstrap.apps as Record<string, EhBackendAppInput>,
        (env) => new Set(bootstrap.envs[env]?.appOverride?.unavailable),
      ),
    ),
    Promise.all([configPairs, deployed]).then(([pairs, found]) => {
      const inScope = found.pairs.filter(
        (p) => appSlugs.includes(p.app) || envSlugs.includes(p.env),
      )
      return deploymentFacets(uniquePairs([...pairs, ...inScope]), found)
    }),
  ])
}

function uniquePairs(pairs: Array<Pair>): Array<Pair> {
  return [...new Map(pairs.map((p) => [keyOf(p), p])).values()]
}
