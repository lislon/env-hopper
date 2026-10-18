import { redirect } from '@tanstack/react-router'
import type { ResourceJumpsData } from '@env-hopper/backend-core'
import type { EhRouterContext } from '~/types/types'
import type { ResourceJumpLoaderReturn } from './types'
import { resourceJumpsFetcher } from '~/api/unsorted/resourceJumpsFetcher'
import { routeLoaderMapper } from '~/modules/crossCuttingParams/utils/routeLoaderMapper'
import { getEhToOptions } from '~/util/route-utils'

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

  // A slug no jump has may be an old name the backend still knows: send the
  // link on to the new one, so old bookmarks keep working.
  if (
    resourceSlug !== undefined &&
    !isKnownJump(resourceSlug, resourceJumpsData)
  ) {
    const rule = await context.trpcClient.tryFindRenameRule.query({
      resourceSlug,
    })
    if (rule && rule.type === 'resourceRename') {
      throw redirect({
        ...getEhToOptions({
          appId: rule.targetSlug,
          envId: params.envSlug,
          subValue,
        }),
        replace: true,
      })
    }
  }

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

function isKnownJump(slug: string, data: ResourceJumpsData | undefined) {
  // Without the jumps nothing can be judged unknown.
  if (!data) return true
  return (
    data.resourceJumps.some((j) => j.slug === slug) ||
    (data.groups ?? []).some((g) => g.slug === slug)
  )
}
