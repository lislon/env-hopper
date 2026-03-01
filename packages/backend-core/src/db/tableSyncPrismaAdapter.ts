import { tableSync } from '@env-hopper/table-sync'
import type { Prisma, PrismaClient } from '@prisma/client'
import type * as runtime from '@prisma/client/runtime/library'
import { mapValues, omit, pick } from 'radashi'

export type ScalarKeys<TPrismaModelName extends Prisma.ModelName> =
  keyof Prisma.TypeMap['model'][TPrismaModelName]['payload']['scalars']
export type ObjectKeys<TPrismaModelName extends Prisma.ModelName> =
  keyof Prisma.TypeMap['model'][TPrismaModelName]['payload']['objects']

export type ScalarFilter<TPrismaModelName extends Prisma.ModelName> = Partial<
  Prisma.TypeMap['model'][TPrismaModelName]['payload']['scalars']
>

export type GetOperationFns<TModel extends Prisma.ModelName> = {
  [TOperation in keyof Prisma.TypeMap['model'][TModel]['operations']]: (
    args: any,
  ) => Promise<any>
}

export interface TableSyncParamsPrisma<
  TPrismaClient extends PrismaClient,
  TPrismaModelName extends Prisma.ModelName,
  TUniqColumns extends ReadonlyArray<ScalarKeys<TPrismaModelName>>,
  TRelationColumns extends ReadonlyArray<ObjectKeys<TPrismaModelName>>,
> {
  id?: ScalarKeys<TPrismaModelName>
  prisma: TPrismaClient
  prismaModelName: TPrismaModelName
  uniqColumns: TUniqColumns
  relationColumns?: TRelationColumns
  where?: ScalarFilter<TPrismaModelName>
  upsertOnly?: boolean
}

function getPrismaModelOperations<
  TPrismaClient extends Omit<PrismaClient, runtime.ITXClientDenyList>,
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

export function tableSyncPrisma<
  TPrismaClient extends PrismaClient,
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
    prisma,
    prismaModelName,
    uniqColumns,
    where: whereGlobal,
    upsertOnly,
  } = params
  const prismOperations = getPrismaModelOperations(prisma, prismaModelName)

  const idColumn = (params.id ?? 'id') as TId
  // @ts-ignore maybe someday later (never)
  return tableSync<MakeTFromPrismaModel<TPrismaModelName>, TUniqColumns, TId>({
    id: idColumn,
    uniqColumns,
    readAll: async () => {
      const findManyArgs = whereGlobal
        ? {
            where: whereGlobal,
          }
        : {}
      return (await prismOperations.findMany(findManyArgs)) as Array<
        MakeTFromPrismaModel<TPrismaModelName>
      >
    },
    writeAll: async (createData, update, deleteIds) => {
      const prismaUniqKey = params.uniqColumns.join('_')
      const relationColumnList =
        params.relationColumns ?? ([] as Array<ObjectKeys<TPrismaModelName>>)

      return prisma.$transaction(async (tx) => {
        const txOps = getPrismaModelOperations(tx, prismaModelName)
        for (const { data, where } of update) {
          const uniqKeyWhere =
            Object.keys(where).length > 1
              ? {
                  [prismaUniqKey]: where,
                }
              : where

          const dataScalar = omit(data, relationColumnList)
          const dataRelations = mapValues(
            pick(data, relationColumnList),
            (value) => {
              return {
                set: value,
              }
            },
          )

          await txOps.update({
            data: { ...dataScalar, ...dataRelations },
            where: { ...uniqKeyWhere },
          })
        }

        if (upsertOnly !== true) {
          await txOps.deleteMany({
            where: {
              [idColumn]: {
                in: deleteIds,
              },
            },
          })
        }

        // Validate uniqueness of uniqColumns before creating records
        const createDataMapped = createData.map((data) => {
          // @ts-expect-error This is too difficult for me to come up with right types
          const dataScalar = omit(data, relationColumnList)

          // @ts-expect-error This is too difficult for me to come up with right types
          const onlyRelationColumns = pick(data, relationColumnList)
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
          const duplicateKeys: Array<string> = []

          for (const data of createDataMapped) {
            const keyParts = params.uniqColumns.map((col) => {
              const value = data[col as keyof typeof data]
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive: unique columns may be nullable in schemas
              return value === null || value === undefined
                ? 'null'
                : String(value)
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
                `Duplicate keys: [${duplicateKeys.join(', ')}]`,
            )
          }
        }

        const results: Array<MakeTFromPrismaModel<TPrismaModelName>> = []

        if (relationColumnList.length === 0) {
          const batchResult = await txOps.createManyAndReturn({
            data: createDataMapped,
          })

          results.push(...batchResult)
        } else {
          for (const dataMappedElement of createDataMapped) {
            const newVar = await txOps.create({
              data: dataMappedElement,
            })
            results.push(newVar as MakeTFromPrismaModel<TPrismaModelName>)
          }
        }

        return results
      })
    },
  })
}
