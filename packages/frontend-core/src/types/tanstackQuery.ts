import type { TRPCRouter } from '@env-hopper/backend-core'
import '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import type { EhDb } from '~/userDb/EhDb'

export interface EhReactQueryMeta extends Record<string, unknown> {
  trpcClient: TRPCClient<TRPCRouter>
  db: EhDb
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: EhReactQueryMeta
    mutationMeta: EhReactQueryMeta
  }
}
