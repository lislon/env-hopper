import { createCachingFetcher } from './createCachingFetcher'
import type {
  ResourceJumpsExtendedData,
  TRPCRouter,
} from '@env-hopper/backend-core'
import type { QueryFunctionContext } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import type { EhDb } from '~/userDb/EhDb'
import { dbCacheDbKeys } from '~/userDb/EhDb'
import { getDbFromMeta, getTrpcFromMeta } from '~/util/reactQueryUtils'

export interface ResourceJumpsExtendedFetcherParams {
  db?: EhDb
  trpcClient?: TRPCClient<TRPCRouter>
}

export function resourceJumpsExtendedFetcher({
  db,
  trpcClient,
}: ResourceJumpsExtendedFetcherParams = {}): (
  ctx: QueryFunctionContext,
) => Promise<ResourceJumpsExtendedData | undefined> {
  return createCachingFetcher<ResourceJumpsExtendedData>({
    cacheKey: dbCacheDbKeys.ResourceJumpsExtended,
    networkFetchFn: trpcClient
      ? () => trpcClient.resourceJumpsExtended.query()
      : (ctx) => getTrpcFromMeta(ctx).resourceJumpsExtended.query(),
    getDbTable: db
      ? () => db.resourceJumpsExtended
      : (ctx) => getDbFromMeta(ctx).resourceJumpsExtended,
    queryKey: ['resourceJumpsExtended'],
  })
}
