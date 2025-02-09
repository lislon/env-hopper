import { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'

export interface CreateQueryParams {
  trpcClient: TRPCClient<TRPCRouter>
}

export function createQueryClient({ trpcClient }: CreateQueryParams) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
        meta: {
          trpcClient,
        },
      },
      mutations: {
        meta: {
          trpcClient,
        },
      },
    },
  })
}
