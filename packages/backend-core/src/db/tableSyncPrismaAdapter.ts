import { tableSync } from '@env-hopper/table-sync'
import type { Prisma, PrismaClient } from '@prisma/client'
import type * as runtime from '@prisma/client/runtime/library'
import { mapValues, omit, pick } from 'radashi'

export type ScalarKeys<PrismaModelName extends Prisma.ModelName> =
  keyof Prisma.TypeMap['model'][PrismaModelName]['payload']['scalars']
export type ObjectKeys<PrismaModelName extends Prisma.ModelName> =
  keyof Prisma.TypeMap['model'][PrismaModelName]['payload']['objects']

export type ScalarFilter<PrismaModelName extends Prisma.ModelName> = Partial<
  Prisma.TypeMap['model'][PrismaModelName]['payload']['scalars']
>

export type GetOperationFns<M extends Prisma.ModelName> = {
  [Op in keyof Prisma.TypeMap['model']['DbAppForCatalog']['operations']]: (
    args: Prisma.TypeMap['model'][M]['operations'][Op]['args'],
  ) => Promise<Prisma.TypeMap['model'][M]['operations'][Op]['result']>
}

export interface TableSyncParamsPrisma<
  MyPrisma extends PrismaClient,
  PrismaModelName extends Prisma.ModelName,
  UniqColumns extends ReadonlyArray<ScalarKeys<PrismaModelName>>,
  RelationColumns extends ReadonlyArray<ObjectKeys<PrismaModelName>>,
> {
  prisma: MyPrisma
  prismaModelName: PrismaModelName
  uniqColumns: UniqColumns
  relationColumns?: RelationColumns
  where?: ScalarFilter<PrismaModelName>
  upsertOnly?: boolean
}

function getPrismaModelOperations<
  MyPrisma extends Omit<PrismaClient, runtime.ITXClientDenyList>,
  PrismaModelName extends Prisma.ModelName,
>(prisma: MyPrisma, prismaModelName: PrismaModelName) {
  const key = (prismaModelName.slice(0, 1).toLowerCase() +
    prismaModelName.slice(1)) as keyof MyPrisma
  return prisma[key] as GetOperationFns<PrismaModelName>
}

export type MakeTFromPrismaModel<PrismaModelName extends Prisma.ModelName> =
  NonNullable<
    Prisma.TypeMap['model'][PrismaModelName]['operations']['findUnique']['result']
  >

export function tableSyncPrisma<
  MyPrisma extends PrismaClient,
  PrismaModelName extends Prisma.ModelName,
  UniqColumns extends ReadonlyArray<ScalarKeys<PrismaModelName>>,
  RelationColumns extends ReadonlyArray<ObjectKeys<PrismaModelName>>,
  ID extends ScalarKeys<PrismaModelName> & (string | number) = 'id',
>(
  params: TableSyncParamsPrisma<
    MyPrisma,
    PrismaModelName,
    UniqColumns,
    RelationColumns
  >,
) {
  const {
    prisma,
    prismaModelName,
    uniqColumns,
    relationColumns,
    where: whereGlobal,
    upsertOnly,
  } = params
  const prismOperations = getPrismaModelOperations(prisma, prismaModelName)

  // @ts-expect-error This is too difficult for me to come up with right types
  return tableSync<MakeTFromPrismaModel<PrismaModelName>, UniqColumns, ID>({
    id: 'id' as ID,
    uniqColumns,
    readAll: async () => {
      const findManyArgs = whereGlobal
        ? {
            where: whereGlobal,
          }
        : {}
      return (await prismOperations.findMany(
        findManyArgs,
      )) as Array<MakeTFromPrismaModel<PrismaModelName>>
    },
    writeAll: async (createData, update, deleteIds) => {
      const prismaUniqKey = params.uniqColumns.join('_')

      return prisma.$transaction(async (tx) => {
        const txOps = getPrismaModelOperations(tx, prismaModelName)
        for (const { data, where } of update) {
          const uniqKeyWhere =
            Object.keys(where).length > 1
              ? {
                  [prismaUniqKey]: where,
                }
              : where

          const dataScalar = omit(data, relationColumns || [])
          const dataRelations = mapValues(
            pick(data, relationColumns || []),
            (value) => {
              return {
                set: value,
              }
            },
          )

          // @ts-expect-error This is too difficult for me to come up with right types
          await txOps.update({
            data: { ...dataScalar, ...dataRelations },
            where: { ...uniqKeyWhere },
          })
        }

        if (upsertOnly !== true) {
          // @ts-expect-error This is too difficult for me to come up with right types
          await txOps.deleteMany({
            where: {
              id: {
                in: deleteIds,
              },
            },
          })
        }

        // Validate uniqueness of uniqColumns before creating records
        const createDataMapped = createData.map((data) => {
          // @ts-expect-error This is too difficult for me to come up with right types
          const dataScalar = omit(data, relationColumns || [])

          // @ts-expect-error This is too difficult for me to come up with right types
          const onlyRelationColumns = pick(data, relationColumns || [])
          const dataRelations = mapValues(onlyRelationColumns, (value) => {
            return {
              connect: value,
            }
          })

          return { ...dataScalar, ...dataRelations }
        })

        // Check for duplicates in the data to be created
        if (createDataMapped.length > 0) {
          const uniqKeysInCreate = new Set<string>()
          const duplicateKeys: string[] = []

          for (const data of createDataMapped) {
            const keyParts = params.uniqColumns.map((col) => {
              const value = data[col as keyof typeof data]
              return value === null || value === undefined ? 'null' : String(value)
            })
            const key = keyParts.join(':')

            if (uniqKeysInCreate.has(key)) {
              duplicateKeys.push(key)
            } else {
              uniqKeysInCreate.add(key)
            }
          }

          if (duplicateKeys.length > 0) {
            const uniqColumnsStr = params.uniqColumns.join(', ')
            throw new Error(
              `Duplicate unique key values found in data to be created. ` +
              `Model: ${prismaModelName}, Unique columns: [${uniqColumnsStr}], ` +
              `Duplicate keys: [${duplicateKeys.join(', ')}]`
            )
          }
        }

        const results: Array<MakeTFromPrismaModel<PrismaModelName>> = []

        if ((params.relationColumns?.length ?? 0) === 0) {
          // @ts-expect-error This is too difficult for me to come up with right types
          const batchResult = await txOps.createManyAndReturn({
            data: createDataMapped,
          })

          results.push(...batchResult)
        } else {
          for (const dataMappedElement of createDataMapped) {
            // @ts-expect-error too difficult for me
            const newVar = await txOps.create({
              data: dataMappedElement,
            })
            results.push(newVar as MakeTFromPrismaModel<PrismaModelName>)
          }
        }

        return results
      })
    },
  })
}
