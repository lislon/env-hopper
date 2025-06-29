import { EhIndexData, TRPCRouter } from '@env-hopper/backend-core';
import { cacheDb, CacheDbKeys } from '~/userDb/cacheDb';
import { QueryClient, QueryKey } from '@tanstack/react-query';
import { TRPCClient } from '@trpc/client';

export interface IndexDataFetcherParams {
  trpc: TRPCClient<TRPCRouter>;
  queryClient: QueryClient,
  queryKey: QueryKey
}

export function indexDataFetcher({ queryClient, queryKey, trpc }: IndexDataFetcherParams): (() => Promise<EhIndexData>) {
  return async () => {
    try {
      const cached = await cacheDb.indexData.get(CacheDbKeys.IndexData);
    if (cached) {
      void syncFromNetwork({ queryClient, queryKey, trpc });
      return cached;
    }
    } catch (e) {
      console.log('Error fetching cached index data:', e);
    }

    return await syncFromNetwork({ queryClient, queryKey, trpc });
  }
}

async function syncFromNetwork({ queryClient, queryKey, trpc }: IndexDataFetcherParams): Promise<EhIndexData> {
  const fresh: EhIndexData = await trpc.index.query();

  await cacheDb.indexData.put(fresh, CacheDbKeys.IndexData);
  queryClient.setQueryData([queryKey], fresh);

  return fresh;
}
