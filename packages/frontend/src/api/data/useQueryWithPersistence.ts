import { EhIndexData } from '@env-hopper/backend-core';
import { QueryKey, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useTRPCClient } from '~/api/infra/trpc';
import { indexDataFetcher } from '~/api/unsorted/indexDataFetcher';

export const shouldPersist = (key: QueryKey) =>
  Array.isArray(key) && key[0] === 'envs';

export function useQueryWithPersistence<T>(
  queryKey2?: QueryKey,
  fetcher?: () => Promise<T>,
  opts?: UseQueryOptions<T>
) {

  // const trpc = useTRPC();
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  // const promiseExtended = cacheDb.indexData.get(CacheDbKeys.IndexData);
  const x = {} as Promise<EhIndexData>;
  const queryKey = ['indexData'];
  const queryFn = indexDataFetcher({ queryKey: queryKey, trpc, queryClient });
  return  useQuery({
    queryKey,
    queryFn,
  })

}
