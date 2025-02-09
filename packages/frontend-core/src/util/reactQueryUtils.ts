import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import type { EhReactQueryMeta } from '~/types/tanstackQuery'

export function getTrpcFromMeta(ctx: {
  meta?: EhReactQueryMeta
}): TRPCClient<TRPCRouter> {
  if (!ctx.meta) {
    throw new Error('Missing TRPC client in context of react-query')
  }
  return ctx.meta.trpcClient
}
