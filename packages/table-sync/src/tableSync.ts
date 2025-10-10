import { group, isEqual, objectify, pick } from 'radashi'
import type { FilteredKeys } from 'radashi'

export interface TableSyncParams<
  T extends object,
  U extends ReadonlyArray<keyof T>,
  ID extends keyof T & (string | number),
> {
  id: ID
  readAll: () => Promise<Array<T>>
  writeAll: (
    create: Array<Omit<T, ID>>,
    update: Array<{
      data: Partial<T>
      where: Pick<T, FilteredKeys<T, U>>
    }>,
    deleteIds: Array<T[ID]>,
  ) => Promise<Array<T>>
  uniqColumns: U
}

export function tableSync<
  T extends object,
  U extends ReadonlyArray<keyof T>,
  ID extends keyof T & (string | number),
>(params: TableSyncParams<T, U, ID>) {
  return {
    async sync<UPT extends Partial<T> & Pick<T, U[number]>>(upsertRaw: Array<UPT>) {
      const existingData = await params.readAll()

      function toStrKey(item: T) {
        return params.uniqColumns.map((column) => item[column]).join(':')
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
      const deletedIds = [...deletedStrKeys].map(
        (strKey) => existingByStrKey[strKey]?.[params.id],
      )

      const inserted = await params.writeAll(
        toCreate || [],
        (toUpdate || []).map((update) => {
          return {
            data: update,
            where: pick<T, U>(update, params.uniqColumns),
          }
        }),
        deletedIds as Array<T[ID]>,
      )

      const findActual = (key: Pick<T, U[number]>) => {
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
        ) as Array<Pick<T, U[number]> & T[ID]>
      }

      return {
        findIdMaybe: (key: Pick<T, U[number]>): T[ID] | undefined => {
          return findActual(key)?.[params.id]
        },

        findIdOrThrow: (key: Pick<T, U[number]>): T[ID] => {
          const maybeInserted = findActual(key)?.[params.id]
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

export interface TableSyncIdBag<T, U extends ReadonlyArray<keyof T>> {
  findId: (key: Pick<T, U[number]>) => T[keyof T] | undefined
}
