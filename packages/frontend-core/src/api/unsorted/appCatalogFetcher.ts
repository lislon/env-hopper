import { createCachingFetcher } from './createCachingFetcher'
import type { AppCatalogData, TRPCRouter } from '@env-hopper/backend-core'
import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import type { EhDb } from '~/userDb/EhDb'
import { dbCacheDbKeys } from '~/userDb/EhDb'
import { getDbFromMeta, getTrpcFromMeta } from '~/util/reactQueryUtils'

export const queryKey: QueryKey = ['appCatalog']

export interface AppCatalogFetcherParams {
  db?: EhDb
  trpcClient?: TRPCClient<TRPCRouter>
}

export function appCatalogFetcher({
  db,
  trpcClient,
}: AppCatalogFetcherParams = {}): (
  ctx: QueryFunctionContext,
) => Promise<AppCatalogData | undefined> {
  return createCachingFetcher<AppCatalogData>({
    cacheKey: dbCacheDbKeys.AppCatalog,
    networkFetchFn: trpcClient
      ? () => trpcClient.appCatalog.query()
      : (ctx) => getTrpcFromMeta(ctx).appCatalog.query(),
    getDbTable: db
      ? () => db.appCatalog
      : (ctx) => getDbFromMeta(ctx).appCatalog,
    queryKey: ['appCatalog'],
  })
}
