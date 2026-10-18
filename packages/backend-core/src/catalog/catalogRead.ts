import type { PrismaClient } from '../generated/prisma/client'
import type {
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

type Sync<TInput> = (
  tx: CatalogTx,
  scope: string,
  list: Array<TInput>,
) => Promise<CatalogSyncCounts>

/**
 * Each sync makes the rows of `scope` equal the list: new rows are created,
 * changed rows updated, identical rows left alone, and rows of the scope the
 * list no longer reports deleted together with what depends on them. A row
 * another scope held is taken over. Sync parents before their children, all
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
  listDeployments: (filter?: {
    appSlug?: string
    environmentSlug?: string
  }) => Promise<Array<CatalogDeploymentView>>
  resolveAlias: (
    componentSlug: string,
    alias: string,
  ) => Promise<CatalogArtifactView | null>
  /** An App's Components and where each is deployed, by Environment. */
  getAppDeployments: (appSlug: string) => Promise<AppDeploymentsData>
}

/** JSON-ready (dates as ISO strings): it is served as is. */
export interface AppDeploymentsData {
  components: Array<{ slug: string; displayName: string }>
  deployments: Array<{
    environmentSlug: string
    componentSlug: string
    targetSlug: string
    version: string
    aliases: Array<string>
    buildUrl: string | null
    deployedAt: string | null
    deployedBy: CatalogUserView | null
    deployUrl: string | null
    source: string
    health: {
      state: HealthState
      checker: string
      observedAt: string
      detail: string | null
    } | null
  }>
}

export interface CatalogArtifactView {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  buildUrl: string | null
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
      filter: { appSlug?: string; environmentSlug?: string } = {},
    ) {
      const rows = await prisma.catalogDeployment.findMany({
        where: {
          component: filter.appSlug ? { appSlug: filter.appSlug } : undefined,
          target: filter.environmentSlug
            ? { environmentSlug: filter.environmentSlug }
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
    async getAppDeployments(appSlug: string): Promise<AppDeploymentsData> {
      const components = await prisma.catalogComponent.findMany({
        where: { appSlug },
        select: { slug: true, displayName: true },
        orderBy: { slug: 'asc' },
      })
      if (components.length === 0) return { components, deployments: [] }
      const rows = await reads.listDeployments({ appSlug })
      // One Deployment per Component per Environment: a live Target wins over
      // a retired one (meta.retired = 'true'), then the latest deploy.
      const rank = (d: CatalogDeploymentView) =>
        [
          d.target.meta['retired'] === 'true' ? 0 : 1,
          d.deployedAt?.getTime() ?? 0,
        ] as const
      const best = new Map<string, CatalogDeploymentView>()
      for (const d of rows) {
        if (!d.target.environmentSlug) continue
        const key = `${d.target.environmentSlug}\u0000${d.component.slug}`
        const held = best.get(key)
        const [a0, a1] = rank(d)
        const [b0, b1] = held ? rank(held) : [-1, -1]
        if (a0 > b0 || (a0 === b0 && a1 > b1)) best.set(key, d)
      }
      return {
        components,
        deployments: [...best.values()].map((d) => ({
          environmentSlug: d.target.environmentSlug!,
          componentSlug: d.component.slug,
          targetSlug: d.target.slug,
          version: d.artifact.version,
          aliases: d.artifact.aliases,
          buildUrl: d.artifact.buildUrl,
          deployedAt: d.deployedAt?.toISOString() ?? null,
          deployedBy: d.deployedBy,
          deployUrl: d.deployUrl,
          source: d.source,
          health: d.health
            ? { ...d.health, observedAt: d.health.observedAt.toISOString() }
            : null,
        })),
      }
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

function toArtifactView(artifact: {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  buildUrl: string | null
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
    buildUrl: artifact.buildUrl,
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
