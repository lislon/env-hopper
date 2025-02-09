import type { TRPCRouter } from '@env-hopper/backend-core'
import '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'

export interface EhReactQueryMeta extends Record<string, unknown> {
  trpcClient: TRPCClient<TRPCRouter>
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: EhReactQueryMeta
    mutationMeta: EhReactQueryMeta
  }
}
