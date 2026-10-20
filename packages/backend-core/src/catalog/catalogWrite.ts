import type { Prisma, PrismaClient } from '../generated/prisma/client'
import { tableSyncPrisma } from '../db/tableSyncPrismaAdapter'
import type {
  Catalog,
  CatalogChange,
  CatalogSyncCounts,
  CatalogTx,
} from './catalogRead'
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

/** Per open transaction, the (Component, Target) of every changed row. */
const touchedIn = new WeakMap<object, Array<Pair>>()
const touch = (tx: object, pairs: Array<Pair>) =>
  touchedIn.get(tx)?.push(...pairs)

/**
 * Drops the Health of the Deployments these parent rows cascade-delete, and
 * counts those Deployments as changed.
 */
const cascadeHealth =
  (parentFilter: (row: Row) => Row) => async (tx: Tx, rows: Array<Row>) => {
    for (const part of chunks(rows)) {
      const pairs = await tx.catalogDeployment.findMany({
        where: { OR: part.map(parentFilter) },
        select: { componentSlug: true, targetSlug: true },
      })
      touch(tx, pairs)
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

/** What a sync returned that says which rows it changed. */
interface Changed {
  created: Array<Row>
  updated: Array<{ row: Row; was: Row }>
  deleted: Array<Row>
}

/** The (Component, Target) of every row created, updated or deleted. */
function pairsOf(
  { created, updated, deleted }: Changed,
  same: (row: Row, was: Row) => boolean = () => false,
): Array<Pair> {
  return [
    ...created,
    ...updated.filter((u) => !same(u.row, u.was)).map((u) => u.row),
    ...deleted,
  ].map((r) => ({
    componentSlug: r['componentSlug'] as string,
    targetSlug: r['targetSlug'] as string,
  }))
}

/** The pairs (App, Environment) the changed rows belong to. */
async function changedPairs(
  tx: Tx,
  touched: Array<Pair>,
): Promise<CatalogChange['pairs']> {
  if (touched.length === 0) return []
  const unique = <T>(list: Array<T>) => [...new Set(list)]
  const [components, targets] = await Promise.all([
    tx.catalogComponent.findMany({
      where: { slug: { in: unique(touched.map((p) => p.componentSlug)) } },
      select: { slug: true, appSlug: true },
    }),
    tx.catalogDeploymentTarget.findMany({
      where: { slug: { in: unique(touched.map((p) => p.targetSlug)) } },
      select: { slug: true, environmentSlug: true },
    }),
  ])
  const appOf = new Map(components.map((c) => [c.slug, c.appSlug]))
  const envOf = new Map(targets.map((t) => [t.slug, t.environmentSlug]))
  const pairs = new Map<string, CatalogChange['pairs'][number]>()
  for (const p of touched) {
    const app = appOf.get(p.componentSlug)
    const env = envOf.get(p.targetSlug)
    if (app && env) pairs.set(`${app}\0${env}`, { app, env })
  }
  return [...pairs.values()]
}

/** A Health that only says it was checked again changes nothing a reader shows. */
const sameHealth = (row: Row, was: Row) =>
  row['state'] === was['state'] &&
  row['checker'] === was['checker'] &&
  (row['detail'] ?? null) === (was['detail'] ?? null)

export function createCatalog(prisma: PrismaClient): Catalog {
  // ponytail: in-process listeners, so only this pod's readers hear its
  // writes; with more than one pod serving, carry them over Postgres
  // LISTEN/NOTIFY.
  const listeners = new Set<(change: CatalogChange) => void>()
  // A new id each boot: a reader holding an id from before a restart has
  // missed whatever changed while it was down.
  const boot = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  let seq = 0
  let lastChangeId = `${boot}-0`
  return {
    async transaction(fn, opts = {}) {
      let pairs: CatalogChange['pairs'] = []
      const result = await prisma.$transaction(
        async (tx) => {
          const touched: Array<Pair> = []
          touchedIn.set(tx, touched)
          const out = await fn(tx as unknown as CatalogTx)
          pairs = await changedPairs(tx, touched)
          return out
        },
        { timeout: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, maxWait: 10_000 },
      )
      // Committed: only now may a reader see it.
      if (pairs.length > 0) {
        lastChangeId = `${boot}-${++seq}`
        const change = { id: lastChangeId, pairs }
        for (const listener of listeners) {
          try {
            listener(change)
          } catch (e) {
            console.error('[catalog] change listener failed', e)
          }
        }
      }
      return result
    },

    onChange(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },

    lastChangeId: () => lastChangeId,

    syncEnvironments: async (
      tx,
      scope,
      list: Array<CatalogEnvironmentInput>,
      opts = {},
    ) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogEnvironment',
          uniqColumns: ['slug'],
          scope,
          upsertOnly: opts.upsertOnly,
        }).sync(
          list.map((e) => ({
            slug: e.slug,
            displayName: e.displayName,
            description: e.description ?? null,
            meta: e.meta ?? {},
          })),
        )
      ).counts,

    syncApps: async (tx, scope, list: Array<CatalogAppInput>, opts = {}) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogApp',
          uniqColumns: ['slug'],
          scope,
          upsertOnly: opts.upsertOnly,
        }).sync(
          list.map((a) => ({
            slug: a.slug,
            displayName: a.displayName,
            leadComponentSlug: a.leadComponentSlug ?? null,
          })),
        )
      ).counts,

    syncComponents: async (
      tx,
      scope,
      list: Array<CatalogComponentInput>,
      opts = {},
    ) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogComponent',
          uniqColumns: ['slug'],
          scope,
          upsertOnly: opts.upsertOnly,
          beforeDelete: cascadeHealth((r) => ({ componentSlug: r['slug'] })),
        }).sync(
          list.map((c) => ({
            slug: c.slug,
            displayName: c.displayName,
            appSlug: c.appSlug ?? null,
            externalIds: c.externalIds ?? {},
            commitUrl: c.commitUrl ?? null,
          })),
        )
      ).counts,

    syncTargets: async (
      tx,
      scope,
      list: Array<CatalogDeploymentTargetInput>,
      opts = {},
    ) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogDeploymentTarget',
          uniqColumns: ['slug'],
          scope,
          upsertOnly: opts.upsertOnly,
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

    syncUsers: async (tx, scope, list: Array<CatalogUserInput>, opts = {}) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogUser',
          uniqColumns: ['username'],
          scope,
          upsertOnly: opts.upsertOnly,
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

    syncReleases: async (
      tx,
      scope,
      list: Array<CatalogReleaseInput>,
      opts = {},
    ) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogRelease',
          uniqColumns: ['key'],
          scope,
          upsertOnly: opts.upsertOnly,
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

    syncArtifacts: async (
      tx,
      scope,
      list: Array<CatalogArtifactInput>,
      opts = {},
    ) =>
      (
        await tableSyncPrisma({
          prisma: txOf(tx),
          prismaModelName: 'CatalogArtifact',
          uniqColumns: ['componentSlug', 'version'],
          scope,
          upsertOnly: opts.upsertOnly,
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
            commitSha: a.commitSha ?? null,
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

    async syncDeployments(
      tx,
      scope,
      list: Array<CatalogDeploymentInput>,
      opts = {},
    ) {
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
      const deployments = await tableSyncPrisma({
        prisma: db,
        prismaModelName: 'CatalogDeployment',
        uniqColumns: ['componentSlug', 'targetSlug'],
        scope,
        upsertOnly: opts.upsertOnly,
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
      // Endpoints of the removed ones went with them. `upsertOnly` replaces
      // the Endpoints of the listed Deployments only.
      const endpointRows = await tableSyncPrisma({
        prisma: db,
        prismaModelName: 'CatalogEndpoint',
        id: 'id',
        uniqColumns: ['componentSlug', 'targetSlug', 'kind', 'url'],
        where: opts.upsertOnly
          ? {
              OR: rows.map(({ componentSlug, targetSlug }) => ({
                componentSlug,
                targetSlug,
              })),
            }
          : { deployment: { scope } },
      }).sync(endpoints)
      touch(tx, [
        ...pairsOf(deployments as Changed),
        ...pairsOf(endpointRows as Changed),
      ])
      return deployments.counts satisfies CatalogSyncCounts
    },

    async syncHealth(tx, scope, list: Array<CatalogHealthInput>, opts = {}) {
      const health = await tableSyncPrisma({
        prisma: txOf(tx),
        prismaModelName: 'CatalogHealth',
        uniqColumns: ['componentSlug', 'targetSlug'],
        scope,
        upsertOnly: opts.upsertOnly,
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
      touch(tx, pairsOf(health as Changed, sameHealth))
      return health.counts
    },

    ...createCatalogReads(prisma),
  }
}
