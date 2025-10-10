import type { Prisma } from '@prisma/client'
import type { ObjectKeys, ScalarKeys } from './tableSyncPrismaAdapter'

interface CommonSyncTableInfo<TPrismaModelName extends Prisma.ModelName> {
  prismaModelName: TPrismaModelName
  uniqColumns: Array<ScalarKeys<TPrismaModelName>>
  relationColumns?: Array<ObjectKeys<TPrismaModelName>>
}

type TableSyncMagazineType = Partial<{
  [key in Prisma.ModelName]: CommonSyncTableInfo<key>
}>

export const TABLE_SYNC_MAGAZINE = {
  DbAppForCatalog: {
    prismaModelName: 'DbAppForCatalog',
    uniqColumns: ['slug'],
  },
} as const satisfies TableSyncMagazineType

export type TableSyncMagazine = typeof TABLE_SYNC_MAGAZINE
export type TableSyncMagazineModelNameKey = keyof TableSyncMagazine
