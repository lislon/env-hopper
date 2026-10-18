import type { PrismaClient } from '../generated/prisma/client'
import type {
  BuiltAtSource,
  CatalogAppInput,
  CatalogArtifactInput,
  CatalogComponentInput,
  CatalogDeploymentInput,
  CatalogDeploymentTargetInput,
  CatalogEnvironmentInput,
  CatalogHealthInput,
  CatalogMeta,
  CatalogReleaseInput,
  CatalogUserInput,
  EndpointKind,
  HealthState,
} from './catalogTypes'

/** A write transaction the Catalog opened; pass it to every sync of the run. */
export interface CatalogTx {
  readonly __catalogTx: never
}

/** What one sync did to its table. */
export interface CatalogSyncCounts {
  created: number
  updated: number
  deleted: number
  unchanged: number
}

export interface CatalogSyncOptions {
  /**
   * Create and update the listed rows, delete nothing: for a run that knows
   * only part of the scope.
   */
  upsertOnly?: boolean
}

type Sync<TInput> = (
  tx: CatalogTx,
  scope: string,
  list: Array<TInput>,
  opts?: CatalogSyncOptions,
) => Promise<CatalogSyncCounts>

/**
 * Each sync makes the rows of `scope` equal the list: new rows are created,
 * changed rows updated, identical rows left alone, and rows of the scope the
 * list no longer reports deleted together with what depends on them (none
 * with `upsertOnly`). A row another scope held is taken over. Sync parents before their children, all
 * inside one `transaction`, so readers never see half a run.
 */
export interface Catalog {
  transaction: <T>(
    fn: (tx: CatalogTx) => Promise<T>,
    opts?: { timeoutMs?: number },
  ) => Promise<T>
  syncEnvironments: Sync<CatalogEnvironmentInput>
  syncApps: Sync<CatalogAppInput>
  syncComponents: Sync<CatalogComponentInput>
  syncTargets: Sync<CatalogDeploymentTargetInput>
  /** Users before the Deployments that name them. */
  syncUsers: Sync<CatalogUserInput>
  syncReleases: Sync<CatalogReleaseInput>
  syncArtifacts: Sync<CatalogArtifactInput>
  /** Counts the Deployments; each Deployment's Endpoints are synced with it. */
  syncDeployments: Sync<CatalogDeploymentInput>
  syncHealth: Sync<CatalogHealthInput>
  /** Filters are AND-ed; an omitted one takes all. */
  listDeployments: (filter?: {
    appSlugs?: Array<string>
    environmentSlugs?: Array<string>
  }) => Promise<Array<CatalogDeploymentView>>
  resolveAlias: (
    componentSlug: string,
    alias: string,
  ) => Promise<CatalogArtifactView | null>
  /**
   * One Deployment per Component per pair (App, Environment), for the
   * Components of `appSlugs` deployed on `envSlugs`; an omitted filter takes
   * all. Pairs with nothing deployed are absent from `pairs`.
   */
  getPairDeployments: (filter: {
    appSlugs?: Array<string>
    envSlugs?: Array<string>
  }) => Promise<PairDeployments>
  /**
   * Each App's Components, the lead marked, for `appSlugs` or for every App
   * when that filter is omitted. Apps without Components are absent.
   */
  getComponents: (filter: {
    appSlugs?: Array<string>
  }) => Promise<Record<string, Array<AppComponent>>>
  /** The profiles of the Users named, by username; unknown ones are absent. */
  getUsers: (usernames: Array<string>) => Promise<PairDeployment['users']>
}

/** JSON-ready (dates as ISO strings): it is served as is. */
export interface PairDeployment {
  components: Array<{ slug: string; displayName: string; lead?: true }>
  /** The Users the rows name, by username. */
  users: Record<
    string,
    { firstName?: string; lastName?: string; avatarUrl?: string }
  >
  rows: Array<{
    componentSlug: string
    targetSlug: string
    version: string
    aliases: Array<string>
    buildUrl?: string
    deployUrl?: string
    deployedAt?: string
    /** Username, a key of `users`. */
    deployedBy?: string
    source: string
    /** Absent: nothing checks it. */
    health?: {
      state: HealthState
      checker: string
      observedAt: string
      detail?: string
    }
    endpoints?: Array<{ kind: EndpointKind; url: string; label?: string }>
  }>
}

/**
 * A Component as pair details show it. `pipelineUrl` is the URL most of its
 * Deployments' build and deploy links fit, with `{{id}}` where each link's id
 * goes: it depends on the Component alone, not on which pairs are read.
 */
export interface AppComponent {
  slug: string
  displayName: string
  lead?: true
  pipelineUrl?: string
}

/** A URL ending in an id: the URL with `{{id}}` there, and the id. */
export function splitId(
  url: string,
): [template: string, id: string] | undefined {
  const m = /^(.*?)(\d+)$/.exec(url)
  return m ? [`${m[1]}{{id}}`, m[2]!] : undefined
}

/** Per Component, the template most of its links fit; a tie goes to the first by name. */
function pipelineUrls(
  links: Array<{ componentSlug: string; url: string | null }>,
): Map<string, string> {
  const counts = new Map<string, Map<string, number>>()
  for (const { componentSlug, url } of links) {
    const split = url ? splitId(url) : undefined
    if (!split) continue
    const byTemplate = counts.get(componentSlug) ?? new Map<string, number>()
    counts.set(componentSlug, byTemplate)
    byTemplate.set(split[0], (byTemplate.get(split[0]) ?? 0) + 1)
  }
  return new Map(
    [...counts].map(([slug, byTemplate]) => [
      slug,
      [...byTemplate].sort(
        (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
      )[0]![0],
    ]),
  )
}

export interface PairDeployments {
  pairs: Array<{
    app: string
    env: string
    rows: PairDeployment['rows']
    users: PairDeployment['users']
  }>
}

export interface CatalogArtifactView {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  builtAtSource: BuiltAtSource | null
  buildUrl: string | null
  changeRequest: string | null
  release: CatalogReleaseInput | null
}

export interface CatalogUserView {
  username: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

export interface CatalogDeploymentView {
  component: { slug: string; displayName: string; appSlug: string | null }
  target: {
    slug: string
    displayName: string
    environmentSlug: string | null
    meta: CatalogMeta
  }
  artifact: CatalogArtifactView
  source: string
  deployedAt: Date | null
  deployedBy: CatalogUserView | null
  deployUrl: string | null
  endpoints: Array<{ kind: EndpointKind; url: string; label?: string }>
  health: {
    state: HealthState
    observedAt: Date
    checker: string
    detail: string | null
  } | null
}

/** Bounded batches: Postgres takes at most 65535 bind parameters a query. */
export function chunks<T>(list: Array<T>, size = 1000): Array<Array<T>> {
  const out: Array<Array<T>> = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

export function createCatalogReads(prisma: PrismaClient) {
  const reads = {
    async listDeployments(
      filter: {
        appSlugs?: Array<string>
        environmentSlugs?: Array<string>
      } = {},
    ) {
      const rows = await prisma.catalogDeployment.findMany({
        where: {
          component: filter.appSlugs
            ? { appSlug: { in: filter.appSlugs } }
            : undefined,
          target: filter.environmentSlugs
            ? { environmentSlug: { in: filter.environmentSlugs } }
            : undefined,
        },
        include: {
          component: true,
          target: true,
          artifact: { include: { release: true } },
          deployer: true,
          endpoints: true,
        },
        orderBy: [{ componentSlug: 'asc' }, { targetSlug: 'asc' }],
      })
      const health = (
        await Promise.all(
          chunks(rows).map((part) =>
            prisma.catalogHealth.findMany({
              where: {
                OR: part.map((r) => ({
                  componentSlug: r.componentSlug,
                  targetSlug: r.targetSlug,
                })),
              },
            }),
          ),
        )
      ).flat()
      const healthOf = new Map(
        health.map((h) => [`${h.componentSlug}\u0000${h.targetSlug}`, h]),
      )
      return rows.map((r) => {
        const h = healthOf.get(`${r.componentSlug}\u0000${r.targetSlug}`)
        return {
          component: {
            slug: r.component.slug,
            displayName: r.component.displayName,
            appSlug: r.component.appSlug,
          },
          target: {
            slug: r.target.slug,
            displayName: r.target.displayName,
            environmentSlug: r.target.environmentSlug,
            meta: r.target.meta as CatalogMeta,
          },
          artifact: toArtifactView(r.artifact),
          source: r.source,
          deployedAt: r.deployedAt,
          deployedBy: r.deployer
            ? {
                username: r.deployer.username,
                firstName: r.deployer.firstName,
                lastName: r.deployer.lastName,
                avatarUrl: r.deployer.avatarUrl,
              }
            : null,
          deployUrl: r.deployUrl,
          endpoints: r.endpoints.map((e) => ({
            kind: e.kind as EndpointKind,
            url: e.url,
            label: e.label ?? undefined,
          })),
          health: h
            ? {
                state: h.state as HealthState,
                observedAt: h.observedAt,
                checker: h.checker,
                detail: h.detail,
              }
            : null,
        } satisfies CatalogDeploymentView
      })
    },
    async getPairDeployments(filter: {
      appSlugs?: Array<string>
      envSlugs?: Array<string>
    }): Promise<PairDeployments> {
      const { appSlugs, envSlugs } = filter
      const rows = await reads.listDeployments({
        appSlugs,
        environmentSlugs: envSlugs,
      })
      // One Deployment per Component per Environment: a live Target wins over
      // a retired one (meta.retired = 'true'), then the latest deploy.
      const rank = (d: CatalogDeploymentView) =>
        [
          d.target.meta['retired'] === 'true' ? 0 : 1,
          d.deployedAt?.getTime() ?? 0,
        ] as const
      const best = new Map<string, CatalogDeploymentView>()
      for (const d of rows) {
        if (!d.target.environmentSlug || !d.component.appSlug) continue
        const key = `${d.target.environmentSlug}\u0000${d.component.slug}`
        const held = best.get(key)
        const [a0, a1] = rank(d)
        const [b0, b1] = held ? rank(held) : [-1, -1]
        if (a0 > b0 || (a0 === b0 && a1 > b1)) best.set(key, d)
      }
      const pairs = new Map<string, PairDeployments['pairs'][number]>()
      for (const d of best.values()) {
        const app = d.component.appSlug!
        const env = d.target.environmentSlug!
        const key = `${app}\u0000${env}`
        const pair = pairs.get(key) ?? { app, env, rows: [], users: {} }
        pairs.set(key, pair)
        const u = d.deployedBy
        if (u) pair.users[u.username] = profileOf(u)
        const h = d.health
        pair.rows.push({
          componentSlug: d.component.slug,
          targetSlug: d.target.slug,
          version: d.artifact.version,
          aliases: d.artifact.aliases,
          ...(d.artifact.buildUrl && { buildUrl: d.artifact.buildUrl }),
          ...(d.deployUrl && { deployUrl: d.deployUrl }),
          ...(d.deployedAt && { deployedAt: d.deployedAt.toISOString() }),
          ...(u && { deployedBy: u.username }),
          source: d.source,
          ...(h && {
            health: {
              state: h.state,
              checker: h.checker,
              observedAt: h.observedAt.toISOString(),
              ...(h.detail && { detail: h.detail }),
            },
          }),
          ...(d.endpoints.length > 0 && { endpoints: d.endpoints }),
        })
      }
      return { pairs: [...pairs.values()] }
    },
    async getComponents({ appSlugs }: { appSlugs?: Array<string> }) {
      const [apps, links] = await Promise.all([
        prisma.catalogApp.findMany({
          where: appSlugs ? { slug: { in: appSlugs } } : undefined,
          select: {
            slug: true,
            leadComponentSlug: true,
            components: {
              select: { slug: true, displayName: true },
              orderBy: { slug: 'asc' },
            },
          },
        }),
        prisma.catalogDeployment.findMany({
          where: {
            component: appSlugs
              ? { appSlug: { in: appSlugs } }
              : { appSlug: { not: null } },
          },
          select: {
            componentSlug: true,
            deployUrl: true,
            artifact: { select: { buildUrl: true } },
          },
        }),
      ])
      const urls = pipelineUrls(
        links.flatMap((l) => [
          { componentSlug: l.componentSlug, url: l.artifact.buildUrl },
          { componentSlug: l.componentSlug, url: l.deployUrl },
        ]),
      )
      const components: Record<string, Array<AppComponent>> = {}
      for (const a of apps) {
        if (a.components.length === 0) continue
        const lead = a.leadComponentSlug ?? a.components[0]!.slug
        components[a.slug] = a.components.map((c) => {
          const pipelineUrl = urls.get(c.slug)
          return {
            ...c,
            ...(c.slug === lead && { lead: true as const }),
            ...(pipelineUrl && { pipelineUrl }),
          }
        })
      }
      return components
    },
    async getUsers(usernames: Array<string>) {
      const users = await prisma.catalogUser.findMany({
        where: { username: { in: usernames } },
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      })
      return Object.fromEntries(users.map((u) => [u.username, profileOf(u)]))
    },
    async resolveAlias(componentSlug: string, alias: string) {
      const a = await prisma.catalogArtifact.findFirst({
        where: { componentSlug, aliases: { has: alias } },
        orderBy: [
          { builtAt: { sort: 'desc', nulls: 'last' } },
          { version: 'desc' },
        ],
        include: { release: true },
      })
      return a ? toArtifactView(a) : null
    },
  }
  return reads
}

/** What a User shows: the name and avatar, never the contact details. */
function profileOf(u: {
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}): PairDeployment['users'][string] {
  return {
    ...(u.firstName && { firstName: u.firstName }),
    ...(u.lastName && { lastName: u.lastName }),
    ...(u.avatarUrl && { avatarUrl: u.avatarUrl }),
  }
}

function toArtifactView(artifact: {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  builtAtSource: string | null
  buildUrl: string | null
  changeRequest: string | null
  release: {
    key: string
    tag: string | null
    commitSha: string | null
    author: string | null
    releasedAt: Date | null
  } | null
}): CatalogArtifactView {
  return {
    version: artifact.version,
    aliases: artifact.aliases,
    builtAt: artifact.builtAt,
    builtAtSource: artifact.builtAtSource as BuiltAtSource | null,
    buildUrl: artifact.buildUrl,
    changeRequest: artifact.changeRequest,
    release: artifact.release
      ? {
          key: artifact.release.key,
          tag: artifact.release.tag ?? undefined,
          commitSha: artifact.release.commitSha ?? undefined,
          author: artifact.release.author ?? undefined,
          releasedAt: artifact.release.releasedAt ?? undefined,
        }
      : null,
  }
}
