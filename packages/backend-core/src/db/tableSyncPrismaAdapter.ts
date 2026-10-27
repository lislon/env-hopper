import { tableSync } from '@env-hopper/table-sync'
import type { Prisma, PrismaClient } from '../generated/prisma/client'
import { mapValues, omit, pick } from 'radashi'

export type ScalarKeys<TPrismaModelName extends Prisma.ModelName> =
  keyof Prisma.TypeMap['model'][TPrismaModelName]['payload']['scalars']
export type ObjectKeys<TPrismaModelName extends Prisma.ModelName> =
  keyof Prisma.TypeMap['model'][TPrismaModelName]['payload']['objects']

export type ScalarFilter<TPrismaModelName extends Prisma.ModelName> = Partial<
  Prisma.TypeMap['model'][TPrismaModelName]['payload']['scalars']
>

/** Any `where` the model's findMany takes, relation filters included. */
export type WhereFilter<TPrismaModelName extends Prisma.ModelName> =
  NonNullable<
    Prisma.TypeMap['model'][TPrismaModelName]['operations']['findMany']['args']['where']
  >

export type GetOperationFns<TModel extends Prisma.ModelName> = {
  [TOperation in keyof Prisma.TypeMap['model'][TModel]['operations']]: (
    args: any,
  ) => Promise<any>
}

/** The root client, or the client of a transaction already open. */
export type PrismaDb = PrismaClient | Prisma.TransactionClient

export interface TableSyncParamsPrisma<
  TPrismaClient extends PrismaDb,
  TPrismaModelName extends Prisma.ModelName,
  TUniqColumns extends ReadonlyArray<ScalarKeys<TPrismaModelName>>,
  TRelationColumns extends ReadonlyArray<ObjectKeys<TPrismaModelName>>,
> {
  id?: ScalarKeys<TPrismaModelName>
  /**
   * Reads and writes all run on this client. Given the root client, the sync
   * opens its own transaction; given a transaction's client, it joins it.
   */
  prisma: TPrismaClient
  prismaModelName: TPrismaModelName
  uniqColumns: TUniqColumns
  relationColumns?: TRelationColumns
  where?: WhereFilter<TPrismaModelName>
  upsertOnly?: boolean
  /**
   * The rows this scope owns, kept in the `scope` column. A sync covers this
   * scope's rows, and takes over rows of the same key another scope holds.
   */
  scope?: string
  /** Adjusts an incoming row against the stored one before comparing. */
  prepare?: (row: Row, stored: Row | undefined) => Row
  /** Runs in the sync's transaction before the deleted rows are deleted. */
  beforeDelete?: (
    db: Prisma.TransactionClient,
    rows: Array<Row>,
  ) => Promise<void>
  /**
   * Max fraction of stored rows one sync may delete (0..1). When set and
   * existing >= 5 and toDelete/existing > maxDeleteShare, no deletes happen.
   */
  maxDeleteShare?: number
}

type Row = Record<string, unknown>

function getPrismaModelOperations<
  TPrismaClient,
  TPrismaModelName extends Prisma.ModelName,
>(prisma: TPrismaClient, prismaModelName: TPrismaModelName) {
  const key = (prismaModelName.slice(0, 1).toLowerCase() +
    prismaModelName.slice(1)) as keyof TPrismaClient
  return prisma[key] as GetOperationFns<TPrismaModelName>
}

export type MakeTFromPrismaModel<TPrismaModelName extends Prisma.ModelName> =
  NonNullable<
    Prisma.TypeMap['model'][TPrismaModelName]['operations']['findUnique']['result']
  >

const CHUNK = 1000
function chunks<T>(list: Array<T>): Array<Array<T>> {
  const out: Array<Array<T>> = []
  for (let i = 0; i < list.length; i += CHUNK)
    out.push(list.slice(i, i + CHUNK))
  return out
}

function inTransaction<T>(
  db: PrismaDb,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return '$transaction' in db
    ? (db as PrismaClient).$transaction(fn)
    : fn(db as Prisma.TransactionClient)
}

export function tableSyncPrisma<
  TPrismaClient extends PrismaDb,
  TPrismaModelName extends Prisma.ModelName,
  TUniqColumns extends ReadonlyArray<ScalarKeys<TPrismaModelName>>,
  TRelationColumns extends ReadonlyArray<ObjectKeys<TPrismaModelName>>,
  TId extends ScalarKeys<TPrismaModelName> = ScalarKeys<TPrismaModelName>,
>(
  params: TableSyncParamsPrisma<
    TPrismaClient,
    TPrismaModelName,
    TUniqColumns,
    TRelationColumns
  >,
) {
  const {
    prismaModelName,
    uniqColumns,
    where: whereGlobal = {},
    upsertOnly,
    scope,
  } = params
  const uniq = uniqColumns as unknown as ReadonlyArray<string>
  const keyOf = (r: Row) => JSON.stringify(uniq.map((c) => r[c]))
  const idColumn = params.id as TId | undefined
  const relationColumnList = (params.relationColumns ?? []) as ReadonlyArray<
    keyof Row
  >
  const uniqWhere = (where: Row) =>
    uniq.length > 1
      ? { [uniq.join('_')]: pick(where, uniq) }
      : pick(where, uniq)

  /** The stored rows of the incoming keys, those of `filter` only. */
  async function readKeys(
    ops: GetOperationFns<TPrismaModelName>,
    rows: Array<Row>,
    filter: Row,
  ): Promise<Array<Row>> {
    const wanted = new Set(rows.map(keyOf))
    const first = uniq[0]!
    const out: Array<Row> = []
    for (const part of chunks([...new Set(rows.map((r) => r[first]))])) {
      const found = (await ops.findMany({
        where: { ...whereGlobal, ...filter, [first]: { in: part } },
      })) as Array<Row>
      out.push(...found.filter((r) => wanted.has(keyOf(r))))
    }
    return out
  }

  /**
   * This scope's rows, plus rows of the incoming keys another scope holds.
   * `upsertOnly` reads the incoming keys alone: nothing else can be deleted.
   */
  async function readExisting(
    ops: GetOperationFns<TPrismaModelName>,
    rows: Array<Row>,
  ): Promise<Array<Row>> {
    if (upsertOnly === true) return readKeys(ops, rows, {})
    if (scope === undefined) {
      return (await ops.findMany({ where: whereGlobal })) as Array<Row>
    }
    const own = (await ops.findMany({
      where: { ...whereGlobal, scope },
    })) as Array<Row>
    return [...own, ...(await readKeys(ops, rows, { scope: { not: scope } }))]
  }

  return {
    sync(rows: Array<Partial<MakeTFromPrismaModel<TPrismaModelName>>>) {
      return inTransaction(params.prisma, async (tx) => {
        const txOps = getPrismaModelOperations(tx, prismaModelName)
        const scoped = (rows as Array<Row>).map((r) =>
          scope === undefined ? r : { ...r, scope },
        )
        const incoming = scoped
        const seen = new Set<string>()
        const duplicateKeys = incoming
          .map(keyOf)
          .filter((k) => seen.size === seen.add(k).size)
        if (duplicateKeys.length > 0) {
          throw new Error(
            `Duplicate unique key values found in data to be synced. ` +
              `Model: ${prismaModelName}, Unique columns: [${uniq.join(', ')}], ` +
              `Duplicate keys: [${duplicateKeys.join(', ')}]`,
          )
        }
        const existing = await readExisting(txOps, incoming)
        const stored = new Map(existing.map((r) => [keyOf(r), r]))
        const prepared = params.prepare
          ? incoming.map((r) => params.prepare!(r, stored.get(keyOf(r))))
          : incoming

        let refusedDeletes: number | undefined

        // @ts-ignore maybe someday later (never)
        const result = await tableSync<Row, ReadonlyArray<string>, string>({
          id: idColumn as string | undefined,
          uniqColumns: uniq,
          readAll: () => Promise.resolve(existing),
          writeAll: async (createData, update, deleteIds, deleteRows) => {
            // ponytail: one UPDATE per changed row; switch to a bulk
            // UPDATE ... FROM (VALUES ...) when a run changes most rows.
            for (const { data } of update) {
              const dataScalar = omit(data, relationColumnList)
              const dataRelations = mapValues(
                pick(data, relationColumnList),
                (value) => ({ set: value }),
              )
              await txOps.update({
                data: { ...dataScalar, ...dataRelations },
                where: uniqWhere(data),
              })
            }

            if (upsertOnly !== true && deleteRows.length > 0) {
              const existingCount = existing.length
              const refuseDelete =
                params.maxDeleteShare !== undefined &&
                existingCount >= 5 &&
                deleteRows.length / existingCount > params.maxDeleteShare

              if (refuseDelete) {
                refusedDeletes = deleteRows.length
              } else {
                await params.beforeDelete?.(tx, deleteRows)
                if (idColumn !== undefined) {
                  for (const part of chunks(deleteIds)) {
                    await txOps.deleteMany({
                      where: { [idColumn]: { in: part } },
                    })
                  }
                } else {
                  for (const part of chunks(deleteRows)) {
                    await txOps.deleteMany({
                      where: { OR: part.map((r) => pick(r, uniq)) },
                    })
                  }
                }
              }
            }

            const createDataMapped = (createData as Array<Row>).map((data) => ({
              ...omit(data, relationColumnList),
              ...mapValues(pick(data, relationColumnList), (value) => ({
                connect: value,
              })),
            }))

            const results: Array<Row> = []
            if (relationColumnList.length === 0) {
              for (const part of chunks(createDataMapped)) {
                results.push(
                  ...((await txOps.createManyAndReturn({
                    data: part,
                  })) as Array<Row>),
                )
              }
            } else {
              for (const data of createDataMapped) {
                results.push((await txOps.create({ data })) as Row)
              }
            }
            return results
          },
        }).sync(prepared)

        return refusedDeletes !== undefined
          ? // Nothing was deleted: no count, and no removal for the history.
            {
              ...result,
              deleted: [],
              counts: { ...result.counts, deleted: 0, refusedDeletes },
            }
          : result
      })
    },
  }
}
