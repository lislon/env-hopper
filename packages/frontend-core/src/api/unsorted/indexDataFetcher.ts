import { createCachingFetcher } from './createCachingFetcher'
import type { BootstrapConfigData, TRPCRouter } from '@env-hopper/backend-core'
import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import { dbCacheDbKeys } from '~/userDb/EhDb'
import { getDbFromMeta } from '~/util/reactQueryUtils'

export const queryKey: QueryKey = ['bootstrapConfig']

export interface IndexDataFetcherParams {
  trpcClient: TRPCClient<TRPCRouter>
  dbOnly?: boolean
}

export function indexDataFetcher({
  trpcClient,
  dbOnly = false,
}: IndexDataFetcherParams): (
  ctx: QueryFunctionContext,
) => Promise<BootstrapConfigData | undefined> {
  return createCachingFetcher<BootstrapConfigData>({
    cacheKey: dbCacheDbKeys.Bootstrap,
    networkFetchFn: () => trpcClient.bootstrap.query(),
    getDbTable: (ctx) => getDbFromMeta(ctx).bootstrap,
    queryKey,
    dbOnly,
  })
}
