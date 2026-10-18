import type { FilteredKeys } from 'radashi'
import { group, isEqual, pick } from 'radashi'

export interface TableSyncParams<
  T extends object,
  TUniqColumns extends ReadonlyArray<keyof T>,
  TId extends keyof T & (string | number),
> {
  /** Surrogate key column. Omit it when the unique columns are the key. */
  id?: TId
  readAll: () => Promise<Array<T>>
  writeAll: (
    create: Array<Omit<T, TId>>,
    update: Array<{
      data: Partial<T>
      where: Pick<T, FilteredKeys<T, TUniqColumns>>
    }>,
    /** The `id` of every row to delete; empty when there is no `id`. */
    deleteIds: Array<T[TId]>,
    /** The existing rows to delete. */
    deleteRows: Array<T>,
  ) => Promise<Array<T>>
  uniqColumns: TUniqColumns
}

export interface TableSyncCounts {
  created: number
  updated: number
  deleted: number
  unchanged: number
}

export function tableSync<
  T extends object,
  TUniqColumns extends ReadonlyArray<keyof T>,
  TId extends keyof T & (string | number),
>(params: TableSyncParams<T, TUniqColumns, TId>) {
  // JSON keeps the column boundaries: a ':' join made ('a:b', 'c') and
  // ('a', 'b:c') the same row.
  function toStrKey(item: Partial<T>) {
    return JSON.stringify(
      params.uniqColumns.map((column) => {
        if (item[column] === undefined) {
          throw new Error(
            `unique column ${String(column)} can't be undefined in entry ${JSON.stringify(item)}`,
          )
        }
        return item[column]
      }),
    )
  }

  return {
    async sync<TUpsert extends Partial<T> & Pick<T, TUniqColumns[number]>>(
      upsertRaw: Array<TUpsert>,
    ) {
      const existingData = await params.readAll()
      const existingByStrKey = new Map(
        existingData.map((item) => [toStrKey(item), item]),
      )

      const isEqualOnKeys = (upsert: Partial<T>, existing: T) => {
        for (const key in upsert) {
          if (!(key in existing)) {
            return false
          }
          if (!isEqual(existing[key], upsert[key])) {
            return false
          }
        }
        return true
      }

      const upsertItems = upsertRaw
      const { toCreate, toUpdate, unmodified } = group(
        upsertItems,
        (upsertItem) => {
          const existing = existingByStrKey.get(toStrKey(upsertItem))
          if (existing === undefined) return 'toCreate'
          return isEqualOnKeys(upsertItem, existing) ? 'unmodified' : 'toUpdate'
        },
      )

      const deletedStrKeys = new Set(existingByStrKey.keys())
      for (const item of upsertItems) {
        deletedStrKeys.delete(toStrKey(item))
      }
      const deletedRows = [...deletedStrKeys].map(
        (strKey) => existingByStrKey.get(strKey)!,
      )
      const idColumn = params.id
      const deletedIds =
        idColumn === undefined
          ? []
          : deletedRows.map((row) => {
              if (row[idColumn] === undefined) {
                throw new Error(
                  `The PK column '${String(idColumn)}' is not presented in ${JSON.stringify(row)}`,
                )
              }
              return row[idColumn]
            })

      const inserted = await params.writeAll(
        toCreate || [],
        (toUpdate || []).map((update) => {
          return {
            data: update,
            where: pick<T, TUniqColumns>(update, params.uniqColumns),
          }
        }),
        deletedIds,
        deletedRows,
      )

      const findActual = (key: Pick<T, TUniqColumns[number]>) => {
        const strKey = toStrKey(key)
        const maybeExisting = existingByStrKey.get(strKey)
        if (maybeExisting !== undefined && !deletedStrKeys.has(strKey)) {
          return maybeExisting
        }
        return inserted.find((ins) => {
          return toStrKey(ins) === strKey
        })
      }

      const findId = (key: Pick<T, TUniqColumns[number]>) => {
        if (idColumn === undefined) {
          throw new Error('tableSync: no `id` column was given')
        }
        return findActual(key)?.[idColumn]
      }

      function getActual() {
        return [...inserted, ...(toUpdate || []), ...(unmodified || [])].map(
          (row) => findActual(row),
        ) as Array<Pick<T, TUniqColumns[number]> & T[TId]>
      }

      const counts: TableSyncCounts = {
        created: toCreate?.length ?? 0,
        updated: toUpdate?.length ?? 0,
        deleted: deletedRows.length,
        unchanged: unmodified?.length ?? 0,
      }

      return {
        counts,
        /** The existing rows this sync deleted. */
        deleted: deletedRows,

        findIdMaybe: (
          key: Pick<T, TUniqColumns[number]>,
        ): T[TId] | undefined => {
          return findId(key)
        },

        findIdOrThrow: (key: Pick<T, TUniqColumns[number]>): T[TId] => {
          const maybeInserted = findId(key)
          if (!maybeInserted) {
            const total = [toCreate, toUpdate, unmodified]
              .map((s) => s?.length || 0)
              .reduce((a, c) => a + c, 0)
            throw new Error(
              `findOrThrow: '${toStrKey(key)}' not found. (Existed #: ${total})`,
            )
          }
          return maybeInserted
        },
        getActual() {
          return getActual()
        },
      }
    },
  }
}

export interface TableSyncIdBag<
  T,
  TUniqColumns extends ReadonlyArray<keyof T>,
> {
  findId: (key: Pick<T, TUniqColumns[number]>) => T[keyof T] | undefined
}
