import { createCachingFetcher } from './createCachingFetcher'
import type { BootstrapPayload, TRPCRouter } from '@env-hopper/backend-core'
import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import { dbCacheDbKeys } from '~/userDb/EhDb'
import { getDbFromMeta } from '~/util/reactQueryUtils'

export const queryKey: QueryKey = ['bootstrapConfig']

export interface IndexDataFetcherParams {
  trpcClient: TRPCClient<TRPCRouter>
}

export function indexDataFetcher({
  trpcClient,
}: IndexDataFetcherParams): (
  ctx: QueryFunctionContext,
) => Promise<BootstrapPayload | undefined> {
  return createCachingFetcher<BootstrapPayload>({
    cacheKey: dbCacheDbKeys.Bootstrap,
    networkFetchFn: () => trpcClient.bootstrap.query(),
    getDbTable: (ctx) => getDbFromMeta(ctx).bootstrap,
    queryKey,
  })
}
