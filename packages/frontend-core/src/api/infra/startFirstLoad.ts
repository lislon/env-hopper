import type { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import { ApiQueryMagazine } from '~/api/ApiQueryMagazine'
import { startPairDetails } from '~/modules/pairDetails/usePreloadSlices'

/**
 * At startup, before anything renders: `bootstrap`, and on a deep link the
 * open pair and the slices around it, all at once. Nothing waits for the
 * router: the jump card needs `bootstrap`, the version line its pair.
 */
export function startFirstLoad(
  queryClient: QueryClient,
  trpcClient: TRPCClient<TRPCRouter>,
  pathname: string,
) {
  void queryClient.prefetchQuery(ApiQueryMagazine.getConfig({ trpcClient }))
  startPairDetails(queryClient, trpcClient, pathname)
}
