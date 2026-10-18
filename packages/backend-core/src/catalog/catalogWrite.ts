import { tableSync } from '@env-hopper/table-sync'
import type { Prisma, PrismaClient } from '../generated/prisma/client'
import type { Catalog } from './catalogRead'
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
} from './catalogTypes'
import { sanitizeUrl } from './healthCheck'

type Row = Record<string, unknown>
type Tx = Prisma.TransactionClient

/** The calls a sync makes on one model; every Catalog delegate has them. */
interface Delegate {
  findMany: (args: { where: Row }) => Promise<Array<Row>>
  update: (args: { where: Row; data: Row }) => Promise<unknown>
  createMany: (args: { data: Array<Row> }) => Promise<unknown>
  deleteMany: (args: { where: Row }) => Promise<unknown>
}

interface Pair {
  componentSlug: string
  targetSlug: string
}

// ponytail: changed rows are updated one statement each; a run where most
// rows change (Health, every run) pays one round trip per row. Switch to a
// bulk UPDATE ... FROM (VALUES ...) if the timeout below is ever reached.
const TX = { timeout: 120_000, maxWait: 10_000 }

const keyOf = (keys: ReadonlyArray<string>) => (r: Row) =>
  keys.map((k) => String(r[k])).join('\u0000')
const pick = (keys: ReadonlyArray<string>, r: Row): Row =>
  Object.fromEntries(keys.map((k) => [k, r[k]]))

/** The row's own rows, plus rows of the same keys another scope holds. */
async function readExisting(
  model: Delegate,
  keys: ReadonlyArray<string>,
  scope: string | undefined,
  rows: Array<Row>,
  where: Row = {},
): Promise<Array<Row>> {
  const key = keyOf(keys)
  const wanted = new Set(rows.map(key))
  const own = scope ? await model.findMany({ where: { ...where, scope } }) : []
  const first = keys[0]!
  const others = (
    await Promise.all(
      chunks([...new Set(rows.map((r) => r[first]))]).map((part) =>
        model.findMany({
          where: {
            ...where,
            ...(scope ? { scope: { not: scope } } : {}),
            [first]: { in: part },
          },
        }),
      ),
    )
  )
    .flat()
    .filter((r) => wanted.has(key(r)))
  return [...own, ...others]
}

/**
 * Makes the stored rows equal `rows`: new keys are created, changed rows
 * updated, identical rows left alone (their updatedAt stays), and existing
 * rows missing from `rows` deleted. Returns the deleted rows.
 */
async function syncRows(
  model: Delegate,
  keys: ReadonlyArray<string>,
  existing: Array<Row>,
  rows: Array<Row>,
): Promise<Array<Row>> {
  const key = keyOf(keys)
  const unique = [...new Map(rows.map((r) => [key(r), r])).values()]
  const whereKey = (r: Row) =>
    keys.length === 1 ? pick(keys, r) : { [keys.join('_')]: pick(keys, r) }
  let deleted: Array<Row> = []
  await tableSync<Row, ReadonlyArray<string>, string>({
    uniqColumns: keys,
    readAll: () => Promise.resolve(existing),
    writeAll: async (create, update, _ids, deleteRows) => {
      deleted = deleteRows
      for (const { data } of update) {
        await model.update({ where: whereKey(data as Row), data: data as Row })
      }
      for (const part of chunks(create)) {
        await model.createMany({ data: part })
      }
      for (const part of chunks(deleteRows)) {
        await model.deleteMany({
          where: { OR: part.map((r) => pick(keys, r)) },
        })
      }
      return []
    },
  }).sync(unique)
  return deleted
}

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

/** Deployments the database will cascade-delete with these parent rows. */
async function cascadedPairs(tx: Tx, where: Array<Row>): Promise<Array<Pair>> {
  return (
    await Promise.all(
      chunks(where).map((part) =>
        tx.catalogDeployment.findMany({
          where: { OR: part },
          select: { componentSlug: true, targetSlug: true },
        }),
      ),
    )
  ).flat()
}

export function createCatalog(prisma: PrismaClient): Catalog {
  /** One scoped sync of one model, in its own transaction. */
  function scoped(
    model: (tx: Tx) => Delegate,
    keys: ReadonlyArray<string>,
    opts: {
      /** The parent-key filters of Deployments a deletion cascades to. */
      cascades?: (deleted: Array<Row>) => Array<Row>
      /** Adjusts an incoming row against the stored one before comparing. */
      adjust?: (row: Row, stored: Row | undefined) => Row
    } = {},
  ) {
    const key = keyOf(keys)
    return async (scope: string, rows: Array<Row>) => {
      await prisma.$transaction(async (tx) => {
        const m = model(tx)
        const existing = await readExisting(m, keys, scope, rows)
        const reported = new Set(rows.map(key))
        const removed = existing.filter((r) => !reported.has(key(r)))
        if (opts.cascades && removed.length) {
          const pairs = await cascadedPairs(tx, opts.cascades(removed))
          await deleteHealthOf(tx, pairs)
        }
        const stored = new Map(existing.map((r) => [key(r), r]))
        const adjust = opts.adjust ?? ((r: Row) => r)
        await syncRows(
          m,
          keys,
          existing,
          rows.map((r) => ({ ...adjust(r, stored.get(key(r))), scope })),
        )
      }, TX)
    }
  }

  const delegate = (name: keyof Tx) => (tx: Tx) =>
    tx[name] as unknown as Delegate

  const environments = scoped(delegate('catalogEnvironment'), ['slug'])
  const apps = scoped(delegate('catalogApp'), ['slug'])
  const components = scoped(delegate('catalogComponent'), ['slug'], {
    cascades: (rs) => rs.map((r) => ({ componentSlug: r['slug'] })),
  })
  const targets = scoped(delegate('catalogDeploymentTarget'), ['slug'], {
    cascades: (rs) => rs.map((r) => ({ targetSlug: r['slug'] })),
  })
  const releases = scoped(delegate('catalogRelease'), ['key'])
  const artifacts = scoped(
    delegate('catalogArtifact'),
    ['componentSlug', 'version'],
    {
      cascades: (rs) =>
        rs.map((r) => ({
          componentSlug: r['componentSlug'],
          version: r['version'],
        })),
      // builtAt keeps the earliest time any run reported: a later sighting
      // of the same build never moves it, and a missing one never clears it.
      adjust: (row, stored) => {
        const was = stored?.['builtAt'] as Date | null | undefined
        const now = row['builtAt'] as Date | undefined
        if (!now) return was ? { ...row, builtAt: was } : row
        return was && was < now ? { ...row, builtAt: was } : row
      },
    },
  )
  const health = scoped(delegate('catalogHealth'), [
    'componentSlug',
    'targetSlug',
  ])

  return {
    syncEnvironments: (scope, list: Array<CatalogEnvironmentInput>) =>
      environments(
        scope,
        list.map((e) => ({
          slug: e.slug,
          displayName: e.displayName,
          description: e.description ?? null,
          meta: e.meta ?? {},
        })),
      ),
    syncApps: (scope, list: Array<CatalogAppInput>) =>
      apps(
        scope,
        list.map((a) => ({ slug: a.slug, displayName: a.displayName })),
      ),
    syncComponents: (scope, list: Array<CatalogComponentInput>) =>
      components(
        scope,
        list.map((c) => ({
          slug: c.slug,
          displayName: c.displayName,
          appSlug: c.appSlug ?? null,
          externalIds: c.externalIds ?? {},
        })),
      ),
    syncTargets: (scope, list: Array<CatalogDeploymentTargetInput>) =>
      targets(
        scope,
        list.map((t) => ({
          slug: t.slug,
          displayName: t.displayName,
          environmentSlug: t.environmentSlug ?? null,
          meta: t.meta ?? {},
        })),
      ),
    syncReleases: (scope, list: Array<CatalogReleaseInput>) =>
      releases(
        scope,
        list.map((r) => ({
          key: r.key,
          tag: r.tag ?? null,
          commitSha: r.commitSha ?? null,
          author: r.author ?? null,
          releasedAt: r.releasedAt ?? null,
        })),
      ),
    syncArtifacts: (scope, list: Array<CatalogArtifactInput>) =>
      artifacts(
        scope,
        list.map((a) => ({
          componentSlug: a.componentSlug,
          version: a.version,
          aliases: a.aliases ?? [],
          releaseKey: a.releaseKey ?? null,
          ...(a.builtAt ? { builtAt: a.builtAt } : {}),
        })),
      ),
    async syncDeployments(scope: string, list: Array<CatalogDeploymentInput>) {
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
            .map((e) => [keyOf(ENDPOINT_KEYS)(e), e] as const),
        ).values(),
      ]
      await prisma.$transaction(async (tx) => {
        const m = delegate('catalogDeployment')(tx)
        const data: Array<Row> = rows.map((d) => ({
          componentSlug: d.componentSlug,
          targetSlug: d.targetSlug,
          version: d.version,
          scope,
          source: d.source,
          deployedAt: d.deployedAt ?? null,
        }))
        const existing = await readExisting(m, PAIR_KEYS, scope, data)
        const removed = await syncRows(m, PAIR_KEYS, existing, data)
        await deleteHealthOf(tx, removed as unknown as Array<Pair>)

        // Endpoints of the reported Deployments; removed ones cascaded.
        const e = delegate('catalogEndpoint')(tx)
        const pairs = new Set(data.map(keyOf(PAIR_KEYS)))
        const current = (
          await readExisting(e, ['componentSlug'], undefined, data)
        ).filter((r) => pairs.has(keyOf(PAIR_KEYS)(r)))
        await syncRows(e, ENDPOINT_KEYS, current, endpoints)
      }, TX)
    },
    syncHealth: (scope, list: Array<CatalogHealthInput>) =>
      health(
        scope,
        lastPerPair(list).map((h) => ({
          componentSlug: h.componentSlug,
          targetSlug: h.targetSlug,
          state: h.state,
          observedAt: h.observedAt,
          checker: h.checker,
          detail: h.detail ?? null,
        })),
      ),
    ...createCatalogReads(prisma),
  }
}

const PAIR_KEYS = ['componentSlug', 'targetSlug']
const ENDPOINT_KEYS = ['componentSlug', 'targetSlug', 'kind', 'url']
const pairKey = (p: Pair) => `${p.componentSlug}\0${p.targetSlug}`

/** One row per (component, target); a later row wins. */
function lastPerPair<T extends Pair>(list: Array<T>): Array<T> {
  return [...new Map(list.map((r) => [pairKey(r), r])).values()]
}
