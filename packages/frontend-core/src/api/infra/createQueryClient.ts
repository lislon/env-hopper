import { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import type { EhDb } from '~/userDb/EhDb'

export interface CreateQueryParams {
  trpcClient: TRPCClient<TRPCRouter>
  db: EhDb
}

export function createQueryClient({ trpcClient, db }: CreateQueryParams) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
        meta: {
          trpcClient,
          db,
        },
      },
      mutations: {
        meta: {
          trpcClient,
          db,
        },
      },
    },
  })
}
