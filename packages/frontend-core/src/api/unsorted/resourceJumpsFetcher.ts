import { createCachingFetcher } from './createCachingFetcher'
import type { ResourceJumpsData, TRPCRouter } from '@env-hopper/backend-core'
import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import type { EhDb } from '~/userDb/EhDb'
import { dbCacheDbKeys } from '~/userDb/EhDb'
import { getDbFromMeta, getTrpcFromMeta } from '~/util/reactQueryUtils'

export const queryKey: QueryKey = ['resourceJumps']

export interface ResourceJumpsFetcherParams {
  db?: EhDb
  trpcClient?: TRPCClient<TRPCRouter>
}

export function resourceJumpsFetcher({
  db,
  trpcClient,
}: ResourceJumpsFetcherParams = {}): (
  ctx: QueryFunctionContext,
) => Promise<ResourceJumpsData | undefined> {
  return createCachingFetcher<ResourceJumpsData>({
    cacheKey: dbCacheDbKeys.ResourceJumps,
    networkFetchFn: trpcClient
      ? () => trpcClient.resourceJumps.query()
      : (ctx) => getTrpcFromMeta(ctx).resourceJumps.query(),
    getDbTable: db
      ? () => db.resourceJumps
      : (ctx) => getDbFromMeta(ctx).resourceJumps,
    queryKey,
  })
}
