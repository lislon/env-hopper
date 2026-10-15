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
  EndpointKind,
  HealthState,
} from './catalogTypes'

export interface Catalog {
  upsertEnvironments: (list: Array<CatalogEnvironmentInput>) => Promise<void>
  upsertApps: (list: Array<CatalogAppInput>) => Promise<void>
  upsertComponents: (list: Array<CatalogComponentInput>) => Promise<void>
  upsertTargets: (list: Array<CatalogDeploymentTargetInput>) => Promise<void>
  upsertArtifacts: (list: Array<CatalogArtifactInput>) => Promise<void>
  replaceReleases: (
    scope: string,
    list: Array<CatalogReleaseInput>,
  ) => Promise<void>
  replaceDeployments: (
    scope: string,
    list: Array<CatalogDeploymentInput>,
  ) => Promise<void>
  replaceHealth: (
    scope: string,
    list: Array<CatalogHealthInput>,
  ) => Promise<void>
  listDeployments: (filter?: {
    appSlug?: string
    environmentSlug?: string
  }) => Promise<Array<CatalogDeploymentView>>
  resolveAlias: (
    componentSlug: string,
    alias: string,
  ) => Promise<CatalogArtifactView | null>
}

export interface CatalogArtifactView {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  release: CatalogReleaseInput | null
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
  endpoints: Array<{ kind: EndpointKind; url: string; label?: string }>
  health: { state: HealthState; observedAt: Date; checker: string } | null
}

/** Bounded batches: Postgres takes at most 65535 bind parameters a query. */
export function chunks<T>(list: Array<T>, size = 1000): Array<Array<T>> {
  const out: Array<Array<T>> = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

export function createCatalogReads(prisma: PrismaClient) {
  return {
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
              }
            : null,
        } satisfies CatalogDeploymentView
      })
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
}

function toArtifactView(artifact: {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  release: {
    key: string
    tag: string | null
    commitSha: string | null
    author: string | null
    createdAt: Date | null
  } | null
}): CatalogArtifactView {
  return {
    version: artifact.version,
    aliases: artifact.aliases,
    builtAt: artifact.builtAt,
    release: artifact.release
      ? {
          key: artifact.release.key,
          tag: artifact.release.tag ?? undefined,
          commitSha: artifact.release.commitSha ?? undefined,
          author: artifact.release.author ?? undefined,
          createdAt: artifact.release.createdAt ?? undefined,
        }
      : null,
  }
}
