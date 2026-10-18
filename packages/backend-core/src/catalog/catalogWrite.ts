import type { Prisma, PrismaClient } from '../generated/prisma/client'
import { tableSyncPrisma } from '../db/tableSyncPrismaAdapter'
import type { Catalog, CatalogSyncCounts, CatalogTx } from './catalogRead'
import { chunks, createCatalogReads } from './catalogRead'
import type {
  CatalogAppInput,
  CatalogArtifactInput,
  CatalogComponentInput,
  CatalogDeploymentInput,
  CatalogDeploymentTargetInput,
  CatalogEnvironmentInput,
  CatalogHealthInput,
  CatalogReleaseInput,
  CatalogUserInput,
} from './catalogTypes'
import { sanitizeUrl } from './healthCheck'

type Tx = Prisma.TransactionClient
type Row = Record<string, unknown>

interface Pair {
  componentSlug: string
  targetSlug: string
}

const DEFAULT_TIMEOUT_MS = 120_000

const txOf = (tx: CatalogTx) => tx as unknown as Tx

/** Health belongs to no Deployment; drop it with the Deployments it described. */
async function deleteHealthOf(tx: Tx, pairs: Array<Pair>) {
  for (const part of chunks(pairs)) {
    await tx.catalogHealth.deleteMany({
      where: {
        OR: part.map(({ componentSlug, targetSlug }) => ({
          componentSlug,
          targetSlug,
        })),
      },
    })
  }
}

/** Drops the Health of the Deployments these parent rows cascade-delete. */
const cascadeHealth =
  (parentFilter: (row: Row) => Row) => async (tx: Tx, rows: Array<Row>) => {
    for (const part of chunks(rows)) {
      const pairs = await tx.catalogDeployment.findMany({
        where: { OR: part.map(parentFilter) },
        select: { componentSlug: true, targetSlug: true },
      })
      await deleteHealthOf(tx, pairs)
    }
  }

// builtAt keeps the earliest time any run reported: a later sighting of the
// same build never moves it, and a missing one never clears it. A build's own
// time always beats one borrowed from a deploy.
function earliestBuiltAt(row: Row, stored: Row | undefined): Row {
  const was = stored?.['builtAt'] as Date | null | undefined
  const now = row['builtAt'] as Date | undefined
  const keep = {
    ...row,
    builtAt: was,
    builtAtSource: stored?.['builtAtSource'] ?? null,
  }
  if (!now) return was ? keep : row
  if (!was) return row
  const fromDeploy = (r: Row | undefined) => r?.['builtAtSource'] === 'deploy'
  if (fromDeploy(row) !== fromDeploy(stored)) {
    return fromDeploy(row) ? keep : row
  }
  return was < now ? keep : row
}

const pairKey = (p: Pair) => `${p.componentSlug}\0${p.targetSlug}`

/** One row per (component, target); a later row wins. */
function lastPerPair<T extends Pair>(list: Array<T>): Array<T> {
  return [...new Map(list.map((r) => [pairKey(r), r])).values()]
}

export function createCatalog(prisma: PrismaClient): Catalog {
  return {
    transaction: (fn, opts = {}) =>
      prisma.$transaction((tx) => fn(tx as unknown as CatalogTx), {
        timeout: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxWait: 10_000,
      }),

    syncEnvironments: async (tx, scope, list: Array<CatalogEnvironmentInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogEnvironment',
          uniqColumns: ['slug'],
          scope,
        }).sync(
          list.map((e) => ({
            slug: e.slug,
            displayName: e.displayName,
            description: e.description ?? null,
            meta: e.meta ?? {},
          })),
        )
      ).counts,

    syncApps: async (tx, scope, list: Array<CatalogAppInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogApp',
          uniqColumns: ['slug'],
          scope,
        }).sync(
          list.map((a) => ({
            slug: a.slug,
            displayName: a.displayName,
            leadComponentSlug: a.leadComponentSlug ?? null,
          })),
        )
      ).counts,

    syncComponents: async (tx, scope, list: Array<CatalogComponentInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogComponent',
          uniqColumns: ['slug'],
          scope,
          beforeDelete: cascadeHealth((r) => ({ componentSlug: r['slug'] })),
        }).sync(
          list.map((c) => ({
            slug: c.slug,
            displayName: c.displayName,
            appSlug: c.appSlug ?? null,
            externalIds: c.externalIds ?? {},
          })),
        )
      ).counts,

    syncTargets: async (tx, scope, list: Array<CatalogDeploymentTargetInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogDeploymentTarget',
          uniqColumns: ['slug'],
          scope,
          beforeDelete: cascadeHealth((r) => ({ targetSlug: r['slug'] })),
        }).sync(
          list.map((t) => ({
            slug: t.slug,
            displayName: t.displayName,
            environmentSlug: t.environmentSlug ?? null,
            meta: t.meta ?? {},
          })),
        )
      ).counts,

    syncUsers: async (tx, scope, list: Array<CatalogUserInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogUser',
          uniqColumns: ['username'],
          scope,
        }).sync(
          [...new Map(list.map((u) => [u.username, u])).values()].map((u) => ({
            username: u.username,
            email: u.email ?? null,
            provider: u.provider ?? null,
            firstName: u.firstName ?? null,
            lastName: u.lastName ?? null,
            avatarUrl: u.avatarUrl ?? null,
          })),
        )
      ).counts,

    syncReleases: async (tx, scope, list: Array<CatalogReleaseInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogRelease',
          uniqColumns: ['key'],
          scope,
        }).sync(
          list.map((r) => ({
            key: r.key,
            tag: r.tag ?? null,
            commitSha: r.commitSha ?? null,
            author: r.author ?? null,
            releasedAt: r.releasedAt ?? null,
          })),
        )
      ).counts,

    syncArtifacts: async (tx, scope, list: Array<CatalogArtifactInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogArtifact',
          uniqColumns: ['componentSlug', 'version'],
          scope,
          prepare: earliestBuiltAt,
          beforeDelete: cascadeHealth((r) => ({
            componentSlug: r['componentSlug'],
            version: r['version'],
          })),
        }).sync(
          list.map((a) => ({
            componentSlug: a.componentSlug,
            version: a.version,
            aliases: a.aliases ?? [],
            releaseKey: a.releaseKey ?? null,
            buildUrl: a.buildUrl ?? null,
            changeRequest: a.changeRequest ?? null,
            ...(a.builtAt
              ? {
                  builtAt: a.builtAt,
                  builtAtSource: a.builtAtSource ?? 'build',
                }
              : {}),
          })),
        )
      ).counts,

    async syncDeployments(tx, scope, list: Array<CatalogDeploymentInput>) {
      const db = txOf(tx)
      const rows = lastPerPair(list)
      const endpoints = [
        ...new Map(
          rows
            .flatMap(({ componentSlug, targetSlug, endpoints: eps = [] }) =>
              eps.map((e) => {
                const url = sanitizeUrl(e.url)
                if (url === null) {
                  // The raw URL may carry credentials: never echo it.
                  throw new Error(
                    `Invalid endpoint URL for ${componentSlug}/${targetSlug}`,
                  )
                }
                return {
                  componentSlug,
                  targetSlug,
                  kind: e.kind,
                  url,
                  label: e.label ?? null,
                }
              }),
            )
            .map(
              (e) =>
                [
                  JSON.stringify([
                    e.componentSlug,
                    e.targetSlug,
                    e.kind,
                    e.url,
                  ]),
                  e,
                ] as const,
            ),
        ).values(),
      ]
      const { counts } = await tableSyncPrisma({
        prisma: db,
        prismaModelName: 'CatalogDeployment',
        uniqColumns: ['componentSlug', 'targetSlug'],
        scope,
        beforeDelete: (t, deleted) =>
          deleteHealthOf(t, deleted as unknown as Array<Pair>),
      }).sync(
        rows.map((d) => ({
          componentSlug: d.componentSlug,
          targetSlug: d.targetSlug,
          version: d.version,
          source: d.source,
          deployedAt: d.deployedAt ?? null,
          deployedBy: d.deployedBy ?? null,
          deployUrl: d.deployUrl ?? null,
        })),
      )
      // Every Deployment of the scope is now one this list reported; the
      // Endpoints of the removed ones went with them.
      await tableSyncPrisma({
        prisma: db,
        prismaModelName: 'CatalogEndpoint',
        id: 'id',
        uniqColumns: ['componentSlug', 'targetSlug', 'kind', 'url'],
        where: { deployment: { scope } },
      }).sync(endpoints)
      return counts satisfies CatalogSyncCounts
    },

    syncHealth: async (tx, scope, list: Array<CatalogHealthInput>) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogHealth',
          uniqColumns: ['componentSlug', 'targetSlug'],
          scope,
        }).sync(
          lastPerPair(list).map((h) => ({
            componentSlug: h.componentSlug,
            targetSlug: h.targetSlug,
            state: h.state,
            observedAt: h.observedAt,
            checker: h.checker,
            detail: h.detail ?? null,
          })),
        )
      ).counts,

    ...createCatalogReads(prisma),
  }
}
