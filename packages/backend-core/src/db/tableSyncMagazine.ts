import type { Prisma } from '@prisma/client'
import type { ObjectKeys, ScalarKeys } from './tableSyncPrismaAdapter'

interface CommonSyncTableInfo<PrismaModelName extends Prisma.ModelName> {
  prismaModelName: PrismaModelName
  uniqColumns: Array<ScalarKeys<PrismaModelName>>
  relationColumns?: Array<ObjectKeys<PrismaModelName>>
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
