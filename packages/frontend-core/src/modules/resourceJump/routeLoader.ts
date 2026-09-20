import type { QueryFunctionContext } from '@tanstack/react-query'
import type { EhRouterContext } from '~/types/types'
import type { ResourceJumpLoaderReturn } from './types'
import { resourceJumpsFetcher } from '~/api/unsorted/resourceJumpsFetcher'
import { routeLoaderMapper } from '~/modules/crossCuttingParams/utils/routeLoaderMapper'

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
  })

  // Create a minimal context object for the query function
  const ctx: QueryFunctionContext = {
    queryKey: ['resourceJumps'],
    meta: { db: context.db, trpcClient: context.trpcClient },
    client: context.queryClient,
    signal: new AbortController().signal,
  }

  // Call the query function to pre-populate cache
  const resourceJumpsData = await queryFn(ctx)

  const resourceSlug = params.appSlug
    ? decodeURIComponent(params.appSlug)
    : undefined
  const subValue = params.subValue
    ? decodeURIComponent(params.subValue)
    : undefined

  return {
    envSlug: params.envSlug,
    resourceSlug,
    subValue,
    crossCuttingParams: routeLoaderMapper(
      subValue,
      resourceJumpsData?.resourceJumps.find((rj) => rj.slug === resourceSlug),
    ),
  }
}
