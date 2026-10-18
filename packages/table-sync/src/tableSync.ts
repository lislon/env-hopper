import type { FilteredKeys } from 'radashi'
import { group, isEqual, objectify, pick } from 'radashi'

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
    deleteIds: Array<T[TId]>,
    /** The existing rows to delete, for tables keyed by their unique columns. */
    deleteRows: Array<T>,
  ) => Promise<Array<T>>
  uniqColumns: TUniqColumns
}

export function tableSync<
  T extends object,
  TUniqColumns extends ReadonlyArray<keyof T>,
  TId extends keyof T & (string | number),
>(params: TableSyncParams<T, TUniqColumns, TId>) {
  return {
    async sync<TUpsert extends Partial<T> & Pick<T, TUniqColumns[number]>>(
      upsertRaw: Array<TUpsert>,
    ) {
      const existingData = await params.readAll()

      function toStrKey(item: T) {
        return params.uniqColumns
          .map((column) => {
            if (item[column] === undefined) {
              throw new Error(
                `unique column ${String(column)} can't be undefined in entry ${JSON.stringify(item)}`,
              )
            }
            return item[column]
          })
          .join(':')
      }

      const existingByStrKey = objectify(existingData, (item) => toStrKey(item))

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
          const strKey = toStrKey(upsertItem)
          const existing = existingByStrKey[strKey]
          if (existing !== undefined) {
            if (isEqualOnKeys(upsertItem, existing)) {
              return 'unmodified'
            } else {
              return 'toUpdate'
            }
          } else {
            return 'toCreate'
          }
        },
      )

      const deletedStrKeys = new Set<keyof typeof existingByStrKey>(
        Object.keys(existingByStrKey),
      )
      for (const item of upsertItems) {
        deletedStrKeys.delete(toStrKey(item))
      }
      const deletedRows = [...deletedStrKeys].map(
        (strKey) => existingByStrKey[strKey]!,
      )
      const idColumn = params.id
      const deletedIds = [...deletedStrKeys].flatMap((strKey) => {
        if (idColumn === undefined) return []
        const existingByStrKeyElementElement =
          existingByStrKey[strKey]?.[idColumn]
        if (existingByStrKeyElementElement === undefined) {
          throw new Error(
            `The PK column '${String(idColumn)}' is not presented in ${JSON.stringify(existingByStrKey[strKey])}`,
          )
        }
        return existingByStrKeyElementElement
      })

      const inserted = await params.writeAll(
        toCreate || [],
        (toUpdate || []).map((update) => {
          return {
            data: update,
            where: pick<T, TUniqColumns>(update, params.uniqColumns),
          }
        }),
        deletedIds as Array<T[TId]>,
        deletedRows,
      )

      const findActual = (key: Pick<T, TUniqColumns[number]>) => {
        const strKey = toStrKey(key)
        const maybeExisting = existingByStrKey[strKey]
        if (maybeExisting !== undefined && !(strKey in deletedStrKeys)) {
          return maybeExisting
        }
        return inserted.find((ins) => {
          return toStrKey(ins) === strKey
        })
      }

      function getActual() {
        return [...inserted, ...(toUpdate || []), ...(unmodified || [])].map(
          (row) => findActual(row),
        ) as Array<Pick<T, TUniqColumns[number]> & T[TId]>
      }

      return {
        findIdMaybe: (
          key: Pick<T, TUniqColumns[number]>,
        ): T[TId] | undefined => {
          return idColumn === undefined
            ? undefined
            : findActual(key)?.[idColumn]
        },

        findIdOrThrow: (key: Pick<T, TUniqColumns[number]>): T[TId] => {
          const maybeInserted =
            idColumn === undefined ? undefined : findActual(key)?.[idColumn]
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
