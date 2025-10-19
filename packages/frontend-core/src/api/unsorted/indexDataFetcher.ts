import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import type { BootstrapConfigData, TRPCRouter } from '@env-hopper/backend-core'
import type { EhDb } from '~/userDb/EhDb'
import { dbCacheDbKeys } from '~/userDb/EhDb'
import { DexieErrorWrapper } from '~/util/error-utils'

export const queryKey: QueryKey = ['bootstrapConfig']

export interface IndexDataFetcherParams {
  trpcClient: TRPCClient<TRPCRouter>
  queryClient: QueryClient
  db: EhDb
}

export function indexDataFetcher({
  queryClient,
  trpcClient,
  db,
}: IndexDataFetcherParams): () => Promise<BootstrapConfigData> {
  return async () => {
  let cached: BootstrapConfigData|undefined = undefined;
    try {
      cached = await db.bootstrap.get(dbCacheDbKeys.Bootstrap)
    } catch (e) {
      console.log('Error fetching cached index data:', e)
      throw new DexieErrorWrapper(e);
    }

    if (cached) {
      void syncFromNetwork({ queryClient, trpcClient, db })
      return cached
    }

    return await syncFromNetwork({ queryClient, trpcClient, db })
  }
}

async function syncFromNetwork({
  queryClient,
  trpcClient,
  db,
}: IndexDataFetcherParams): Promise<BootstrapConfigData> {
  const fresh: BootstrapConfigData = await trpcClient.bootstrap.query()

  await db.bootstrap.put(fresh, dbCacheDbKeys.Bootstrap)
  queryClient.setQueryData([queryKey], fresh)

  return fresh
}
