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

  const result = useQuery(ApiQueryMagazine.getConfig({ trpcClient }))
  if (isDexieError(result.failureReason)) {
    throw result.failureReason
  }
  return result
}
