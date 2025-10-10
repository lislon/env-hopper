import type { QueryFunctionContext } from '@tanstack/react-query'
import type { EhRouterContext } from '~/types/types'
import { appCatalogFetcher } from '~/api/unsorted/appCatalogFetcher'

export interface CatalogRouteLoaderCtx {
  context: EhRouterContext
}

export async function catalogRouteLoader({
  context,
}: CatalogRouteLoaderCtx): Promise<void> {
  // Try to load cached data from IndexedDB to pre-populate React Query cache
  const queryFn = appCatalogFetcher({
    db: context.db,
    trpcClient: context.trpcClient,
  })

  // Create a minimal context object for the query function
  const ctx: QueryFunctionContext = {
    queryKey: ['appCatalog'],
    meta: { db: context.db, trpcClient: context.trpcClient },
    client: context.queryClient,
    signal: new AbortController().signal,
  }

  // Call the query function to pre-populate cache
  await queryFn(ctx)
}
