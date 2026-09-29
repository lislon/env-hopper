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
        /*
         * How long data counts as fresh. Without it the default is 0, meaning
         * every query is stale the moment it arrives — so each further component
         * that mounts and asks for the same key starts another background
         * refetch. Measured on a cold production load, that fetched the resource
         * jumps THREE times and the bootstrap twice, because five components ask
         * for the jumps at different points in the render tree. Only the calls
         * that happened to coincide were batched into one request.
         *
         * `gcTime` below does not help with this: it governs how long an unused
         * entry is kept before being discarded, not how long it is trusted.
         *
         * Five minutes because this is a catalogue — it changes when someone
         * edits configuration, not per interaction. A deployment is what makes it
         * genuinely out of date, and that is handled by the service worker
         * replacing the page rather than by polling for it.
         */
        staleTime: 1000 * 60 * 5,
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
