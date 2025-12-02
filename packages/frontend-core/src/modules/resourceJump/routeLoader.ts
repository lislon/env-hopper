import type { QueryFunctionContext } from '@tanstack/react-query'
import {
  quickJumpFetcher,
  quickSlotsQueryKey,
} from '~/api/unsorted/quickJumpFetcher'
import { resourceJumpsFetcher } from '~/api/unsorted/resourceJumpsFetcher'
import type { EhRouterContext } from '~/types/types'
import type { ResourceJumpLoaderReturn } from './types'

export interface RouteLoaderCtx {
  params: {
    envSlug?: string
    appSlug?: string
    subValue?: string
  }
  context: EhRouterContext
}

export async function routeLoader({
  params,
  context,
}: RouteLoaderCtx): Promise<ResourceJumpLoaderReturn> {
  // Try to load cached data from IndexedDB to pre-populate React Query cache
  const queryFn = resourceJumpsFetcher({
    db: context.db,
    trpcClient: context.trpcClient,
    dbOnly: true,
  })

  // Create a minimal context object for the query function
  const ctx: QueryFunctionContext = {
    queryKey: ['resourceJumps'],
    meta: { db: context.db, trpcClient: context.trpcClient },
    client: context.queryClient,
    signal: new AbortController().signal,
  }

  // Call the query function to pre-populate cache
  await queryFn(ctx)

  // Preload quick slots from IndexedDB into React Query cache (DB-only)
  const quickFn = quickJumpFetcher()
  const quickCtx: QueryFunctionContext = {
    queryKey: quickSlotsQueryKey,
    meta: { db: context.db, trpcClient: context.trpcClient },
    client: context.queryClient,
    signal: new AbortController().signal,
  }
  const quickData = await quickFn(quickCtx)
  context.queryClient.setQueryData(quickSlotsQueryKey, quickData)

  return {
    envSlug: params.envSlug,
    resourceSlug: params.appSlug,
    crossCuttingParams: params.subValue ? [{
      slug: 'sub-legacy',
      stringValue: params.subValue,
    }] : []
  }
}
