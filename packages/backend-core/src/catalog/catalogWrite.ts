import type { Prisma, PrismaClient } from '../generated/prisma/client'
import { tableSyncPrisma } from '../db/tableSyncPrismaAdapter'
import { publicMessage } from './publicMessage'
import type {
  Catalog,
  CatalogChange,
  CatalogSyncCounts,
  CatalogTx,
} from './catalogRead'
import { chunks, createCatalogReads } from './catalogRead'
import type {
  AppEnvFreshnessInput,
  CatalogAppInput,
  CatalogArtifactInput,
  CatalogComponentInput,
  CatalogDeployAttemptInput,
  CatalogDeploymentInput,
  CatalogDeploymentTargetInput,
  CatalogEnvironmentInput,
  CatalogHealthInput,
  CatalogReleaseInput,
  CatalogUserInput,
  DeliveryFactsInput,
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
/** Per open transaction, the AppEnvs whose freshness changed (`env` may be `ALL_ENVS`). */
const freshenedIn = new WeakMap<object, CatalogChange['pairs']>()

/**
 * Drops the Health of the Deployments these parent rows cascade-delete, and
 * counts those Deployments, and the Deploy Attempts they cascade-delete, as
 * changed.
 */
const cascadeHealth =
  // `run` is the Catalog's transaction, whose changes are reported: the
  // client a sync hands `beforeDelete` is not the same object.
  (run: CatalogTx, parentFilter: (row: Row) => Row) =>
    async (tx: Tx, rows: Array<Row>) => {
      for (const part of chunks(rows)) {
        const where = { OR: part.map(parentFilter) }
        const select = { componentSlug: true, targetSlug: true } as const
        const [pairs, attempts] = await Promise.all([
          tx.catalogDeployment.findMany({ where, select }),
          tx.catalogDeployAttempt.findMany({ where, select }),
        ])
        touch(run, [...pairs, ...attempts])
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

const str = (v: unknown) => (typeof v === 'string' ? v : null)
const date = (v: unknown) => (v instanceof Date ? v : null)
const sameTime = (a: unknown, b: unknown) =>
  (date(a)?.getTime() ?? null) === (date(b)?.getTime() ?? null)

/** A DeploymentHistory row before its App and Environment are known. */
type HistoryRow = Omit<
  Prisma.DeploymentHistoryCreateManyInput,
  'appSlug' | 'envSlug'
> & { componentSlug: string; targetSlug: string }

const deployedRow = (r: Row, previous?: unknown): HistoryRow => ({
  componentSlug: r['componentSlug'] as string,
  targetSlug: r['targetSlug'] as string,
  kind: 'deployed',
  version: str(r['version']),
  previous: str(previous),
  deployedAt: date(r['deployedAt']),
  deployedBy: str(r['deployedBy']),
  source: str(r['source']),
  eventAt: date(r['deployedAt']),
})

/**
 * The history of what a Deployments sync changed: a Deployment that
 * appeared, one whose version or deploy time changed (a redeploy), one gone.
 */
function deploymentChanges({ created, updated, deleted }: Changed) {
  return [
    ...created.map((r) => deployedRow(r)),
    ...updated
      .filter(
        ({ row, was }) =>
          row['version'] !== was['version'] ||
          !sameTime(row['deployedAt'], was['deployedAt']),
      )
      .map(({ row, was }) => deployedRow(row, was['version'])),
    ...deleted.map(
      (r): HistoryRow => ({
        componentSlug: r['componentSlug'] as string,
        targetSlug: r['targetSlug'] as string,
        kind: 'removed',
        version: str(r['version']),
        source: str(r['source']),
        // The removed Deployment's own time: a second writer of the same
        // removal writes the same row.
        eventAt: date(r['deployedAt']),
      }),
    ),
  ]
}

/** The history of what an attempts sync changed: one started, or its status moved. */
function attemptChanges({ created, updated }: Changed) {
  return [
    ...created,
    ...updated
      .filter(
        ({ row, was }) =>
          row['status'] !== was['status'] || row['version'] !== was['version'],
      )
      .map(({ row }) => row),
  ].map(
    (r): HistoryRow => ({
      componentSlug: r['componentSlug'] as string,
      targetSlug: r['targetSlug'] as string,
      kind: 'attempt',
      version: str(r['version']),
      status: str(r['status']),
      deployedBy: str(r['startedBy']),
      eventAt:
        r['status'] === 'running'
          ? date(r['startedAt'])
          : (date(r['endedAt']) ?? date(r['startedAt'])),
    }),
  )
}

/** Appends `rows` to DeploymentHistory, each with its App and Environment as they are now. */
async function recordHistory(db: Tx, rows: Array<HistoryRow>) {
  if (rows.length === 0) return
  const [components, targets] = await Promise.all([
    db.catalogComponent.findMany({
      where: { slug: { in: [...new Set(rows.map((r) => r.componentSlug))] } },
      select: { slug: true, appSlug: true },
    }),
    db.catalogDeploymentTarget.findMany({
      where: { slug: { in: [...new Set(rows.map((r) => r.targetSlug))] } },
      select: { slug: true, environmentSlug: true },
    }),
  ])
  const appOf = new Map(components.map((c) => [c.slug, c.appSlug]))
  const envOf = new Map(targets.map((t) => [t.slug, t.environmentSlug]))
  // ON CONFLICT DO NOTHING on the event's unique index: two pods writing the
  // same change (a rollout's overlap) write it once.
  await db.deploymentHistory.createMany({
    skipDuplicates: true,
    data: rows.map((r) => ({
      ...r,
      appSlug: appOf.get(r.componentSlug) ?? null,
      envSlug: envOf.get(r.targetSlug) ?? null,
    })),
  })
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

/** The two calls `insertFacts` makes on a fact table's Prisma delegate. */
interface FactTable {
  createMany: (args: {
    data: Array<Row>
    skipDuplicates: boolean
  }) => Promise<unknown>
  updateMany: (args: { where: Row; data: Row }) => Promise<unknown>
}

/**
 * Inserts the rows not stored yet, then fills each `fill` column still NULL
 * with the row's value: a stored value never changes.
 */
async function insertFacts(
  table: unknown,
  rows: Array<Row>,
  key: Array<string>,
  fill: Array<string> = [],
) {
  if (rows.length === 0) return
  const t = table as FactTable
  await t.createMany({ data: rows, skipDuplicates: true })
  // ponytail: one update per filled column; batch with UNNEST if fact batches grow past a few hundred.
  for (const row of rows) {
    for (const col of fill) {
      if (row[col] === undefined || row[col] === null) continue
      await t.updateMany({
        where: {
          ...Object.fromEntries(key.map((k) => [k, row[k]])),
          [col]: null,
        },
        data: { [col]: row[col] },
      })
    }
  }
}

/** Facts bypass `tableSyncPrisma` on purpose: insert-only, never scope-synced. */
async function writeFactsIn(tx: Tx, f: DeliveryFactsInput) {
  const repo = ['repositoryKey']
  await insertFacts(
    tx.catalogRepository,
    (f.repositories ?? []).map((r) => ({ ...r })),
    ['key'],
  )
  await insertFacts(
    tx.catalogCommit,
    (f.commits ?? []).map((c) => ({ ...c })),
    [...repo, 'sha'],
    ['committedAt', 'author', 'changeRequestNumber'],
  )
  await insertFacts(
    tx.catalogBuild,
    (f.builds ?? []).map((b) => ({ ...b })),
    [...repo, 'buildId'],
    ['outcome', 'finishedAt', 'triggeredBy'],
  )
  await insertFacts(
    tx.catalogTag,
    (f.tags ?? []).map((t) => ({ ...t })),
    [...repo, 'name'],
    ['releaseTitle', 'createdAt', 'createdBy'],
  )
  const changeRequests = f.changeRequests ?? []
  await insertFacts(
    tx.catalogChangeRequest,
    changeRequests.map(({ workItems: _, ...cr }) => cr),
    [...repo, 'number'],
    ['mergeSha', 'mergedAt', 'mergedBy'],
  )
  await insertFacts(
    tx.catalogChangeRequestWorkItem,
    changeRequests.flatMap(({ repositoryKey, number, workItems = [] }) =>
      workItems.map((workItemKey, position) => ({
        repositoryKey,
        number,
        workItemKey,
        position,
      })),
    ),
    [...repo, 'number', 'workItemKey'],
  )
  await insertFacts(
    tx.catalogDeclaredVersion,
    (f.declaredVersions ?? []).map((d) => ({ ...d })),
    [...repo, 'sha', 'type'],
  )
  // Work Items are snapshots: the newer read replaces the stored one.
  for (const { key, ...item } of f.workItems ?? []) {
    const data = {
      title: item.title ?? null,
      type: item.type ?? null,
      url: item.url ?? null,
      readAt: item.readAt,
    }
    await tx.catalogWorkItem.upsert({
      where: { key },
      create: { key, ...data },
      update: data,
    })
  }
}

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
          const freshened: CatalogChange['pairs'] = []
          touchedIn.set(tx, touched)
          freshenedIn.set(tx, freshened)
          const out = await fn(tx as unknown as CatalogTx)
          pairs = [
            ...new Map(
              [...(await changedPairs(tx, touched)), ...freshened].map((p) => [
                `${p.app}\0${p.env}`,
                p,
              ]),
            ).values(),
          ]
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

    writeFacts: (facts) =>
      prisma.$transaction((tx) => writeFactsIn(tx, facts), {
        timeout: DEFAULT_TIMEOUT_MS,
        maxWait: 10_000,
      }),

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
          maxDeleteShare: opts.maxDeleteShare,
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
          maxDeleteShare: opts.maxDeleteShare,
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
          maxDeleteShare: opts.maxDeleteShare,
          beforeDelete: cascadeHealth(tx, (r) => ({
            componentSlug: r['slug'],
          })),
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
          maxDeleteShare: opts.maxDeleteShare,
          beforeDelete: cascadeHealth(tx, (r) => ({ targetSlug: r['slug'] })),
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
          maxDeleteShare: opts.maxDeleteShare,
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
          maxDeleteShare: opts.maxDeleteShare,
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
          maxDeleteShare: opts.maxDeleteShare,
          prepare: earliestBuiltAt,
          beforeDelete: cascadeHealth(tx, (r) => ({
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
            buildRepositoryKey: a.build?.repositoryKey ?? null,
            buildId: a.build?.buildId ?? null,
            // Only defined keys: the stored JSON compares equal to the next run's.
            changeRequest: a.changeRequest
              ? JSON.parse(JSON.stringify(a.changeRequest))
              : null,
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
        maxDeleteShare: opts.maxDeleteShare,
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
      await recordHistory(db, deploymentChanges(deployments as Changed))
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
        maxDeleteShare: opts.maxDeleteShare,
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

    syncAppEnvFreshness: async (
      tx,
      scope,
      list: Array<AppEnvFreshnessInput>,
      opts = {},
    ) => {
      const synced = await tableSyncPrisma({
        prisma: txOf(tx),
        prismaModelName: 'AppEnvFreshness',
        uniqColumns: ['appSlug', 'envSlug'],
        scope,
        upsertOnly: opts.upsertOnly,
        maxDeleteShare: opts.maxDeleteShare,
      }).sync(
        [
          ...new Map(
            list.map((f) => [`${f.appSlug}\0${f.envSlug}`, f]),
          ).values(),
        ].map((f) => ({
          appSlug: f.appSlug,
          envSlug: f.envSlug,
          checkedAt: f.checkedAt,
          reading: f.reading ?? [],
          failedSource: f.failed?.source ?? null,
          failedAt: f.failed?.at ?? null,
          failedReason: f.failed?.reason ?? null,
          failedMessage: f.failed?.message
            ? publicMessage(f.failed.message)
            : null,
          sources: f.sources?.length
            ? f.sources.map((s) => ({
                source: s.source,
                at: s.at.toISOString(),
              }))
            : null,
        })),
      )
      // A freshness changes no Deployment, but an open page shows it: its
      // readers are told, as for any change (pairsWatch).
      const { created, updated, deleted } = synced as unknown as Changed
      freshenedIn.get(tx)?.push(
        ...[...created, ...updated.map((u) => u.row), ...deleted].map((r) => ({
          app: r['appSlug'] as string,
          env: r['envSlug'] as string,
        })),
      )
      return synced.counts
    },

    async syncDeployAttempts(
      tx,
      scope,
      list: Array<CatalogDeployAttemptInput>,
      opts = {},
    ) {
      const attempts = await tableSyncPrisma({
        prisma: txOf(tx),
        prismaModelName: 'CatalogDeployAttempt',
        uniqColumns: ['componentSlug', 'targetSlug'],
        scope,
        upsertOnly: opts.upsertOnly,
        maxDeleteShare: opts.maxDeleteShare,
      }).sync(
        lastPerPair(list).map((a) => ({
          componentSlug: a.componentSlug,
          targetSlug: a.targetSlug,
          version: a.version,
          status: a.status,
          startedAt: a.startedAt ?? null,
          endedAt: a.endedAt ?? null,
          startedBy: a.by ?? null,
          deployUrl: a.deployUrl ?? null,
          jobUrl: a.jobUrl ?? null,
          ref: a.ref ?? null,
        })),
      )
      await recordHistory(txOf(tx), attemptChanges(attempts as Changed))
      touch(tx, pairsOf(attempts as Changed))
      return attempts.counts
    },

    ...createCatalogReads(prisma),
  }
}
