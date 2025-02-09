import { ApiQueryMagazineHistory } from '../environment/ApiQueryMagazineEnvironment'
import { makePluginInterfaceForCore } from '../pluginCore/makePluginManagerContext'
import { ApiQueryMagazineResouceJump } from './ApiQueryMagazineResourceJump'
import { findBestMatchByUrl } from './findBestMatchByUrl'
import type { EhRouterContext } from '~/types/types'
import type { ResourceJumpLoaderReturn } from './types'
import { ApiQueryMagazine } from '~/api/ApiQueryMagazine'

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
  const [bootstrapConfig, resourceJumps] = await Promise.all([
    context.queryClient.ensureQueryData(ApiQueryMagazine.getConfig(context)),
    context.queryClient.ensureQueryData(
      ApiQueryMagazineResouceJump.getResourceJumps(),
    ),
  ])

  const pluginInterfaceForCore = makePluginInterfaceForCore(context.plugins)
  const resourceJumpItems =
    await pluginInterfaceForCore.getResourceJumpsItems(bootstrapConfig)

  const { env, resourceJump } = await findBestMatchByUrl({
    urlEnvSlug: params.envSlug,
    urlAppSlug: params.appSlug,
    envs: bootstrapConfig.envs,
    resourceJumps: resourceJumpItems,
    getEnvHistory: () =>
      context.queryClient.ensureQueryData(
        ApiQueryMagazineHistory.getEnvSelectionHistory(context),
      ),
    getNameMigrations: (migrationParams) =>
      context.queryClient.ensureQueryData(
        ApiQueryMagazineResouceJump.getNameMigration(migrationParams),
      ),
    getAvailabilityMatrix: () =>
      context.queryClient.ensureQueryData(
        ApiQueryMagazineResouceJump.getAvailabilityMatrix(),
      ),
  })

  return {
    envSlug: env?.slug,
    resourceSlug: resourceJump?.slug,
    resourceJumps,
    pluginInterfaceForCore,
  }
}
