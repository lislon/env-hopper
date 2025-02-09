import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiQueryMagazine } from '../ApiQueryMagazine'
import type { QueryKey} from '@tanstack/react-query';
import { useTRPCClient } from '~/api/infra/trpc'
import { useDb } from '~/userDb/DbContext'

export const shouldPersist = (key: QueryKey) =>
  Array.isArray(key) && key[0] === 'envs'

export function useQueryBootstrapConfig() {
  // const trpc = useTRPC();
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const db = useDb()

  return useQuery(ApiQueryMagazine.getConfig({ trpcClient, queryClient, db }))
}
