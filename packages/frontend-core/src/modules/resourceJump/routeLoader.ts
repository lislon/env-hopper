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
  // Through the query cache, so the jumps load once however many routes and
  // components ask, and IndexedDB's copy answers first when there is one.
  const resourceJumpsData = await context.queryClient.fetchQuery({
    queryKey: ['resourceJumps'],
    queryFn: resourceJumpsFetcher({
      db: context.db,
      trpcClient: context.trpcClient,
    }),
  })

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
      resourceSlug,
      resourceJumpsData,
    ),
  }
}
