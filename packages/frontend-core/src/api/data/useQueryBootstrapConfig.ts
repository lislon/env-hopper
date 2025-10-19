import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiQueryMagazine } from '../ApiQueryMagazine'
import type { QueryKey } from '@tanstack/react-query'
import { useTRPCClient } from '~/api/infra/trpc'
import { useDb } from '~/userDb/DbContext'
import { isDexieError } from '~/util/error-utils'

export const shouldPersist = (key: QueryKey) =>
  Array.isArray(key) && key[0] === 'envs'

export function useQueryBootstrapConfig() {
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const db = useDb()

  const result = useQuery(ApiQueryMagazine.getConfig({ trpcClient, queryClient, db }))
  if (isDexieError(result.failureReason)) {
    throw result.failureReason;
  }
  return result
}
