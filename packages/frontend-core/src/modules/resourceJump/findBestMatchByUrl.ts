import { sort } from 'radashi'
import type {
  AvailiabilityMatrixData,
  EhEnvIndexed,
  RenameRule,
  RenameRuleParams,
} from '@env-hopper/backend-core'
import type { EnvironmentHistoryItem } from '../environment/types'
import type { ResourceJumpItem } from './types'
import type { AvailabilitySlugPair } from '~/util/availabilityMatrixUtils'
import { findAvailableResources } from '~/util/availabilityMatrixUtils'

export interface FindBestMatchingResourceJumpParams {
  urlEnvSlug: string | undefined
  urlAppSlug: string | undefined
  envs: Record<string, EhEnvIndexed>
  resourceJumps: Record<string, ResourceJumpItem>
  getEnvHistory: () => Promise<Array<EnvironmentHistoryItem>>
  getAvailabilityMatrix: () => Promise<AvailiabilityMatrixData>
  getNameMigrations: (params: RenameRuleParams) => Promise<RenameRule | false>
}

export interface BestMatchByUrlReturn {
  env: EhEnvIndexed | undefined
  resourceJump: ResourceJumpItem | undefined
}

export async function findBestMatchByUrl({
  urlAppSlug,
  urlEnvSlug,
  envs,
  resourceJumps,
  getEnvHistory,
  getAvailabilityMatrix,
  getNameMigrations,
}: FindBestMatchingResourceJumpParams): Promise<BestMatchByUrlReturn> {
  let envFound: EhEnvIndexed | undefined = undefined
  let resourceJumpFound: ResourceJumpItem | undefined = undefined

  if (urlAppSlug !== undefined) {
    resourceJumpFound = resourceJumps[urlAppSlug]
    if (!resourceJumpFound) {
      const migrationRule = await getNameMigrations({
        envSlug: undefined,
        resourceSlug: urlAppSlug,
      })
      if (migrationRule !== false && migrationRule.type === 'resourceRename') {
        resourceJumpFound = resourceJumps[migrationRule.targetSlug]
      }
    }
  }

  if (urlEnvSlug !== undefined) {
    envFound = envs[urlEnvSlug]
  }
  if (!envFound) {
    const migrationRule = await getNameMigrations({
      envSlug: urlEnvSlug,
      resourceSlug: undefined,
    })
    if (migrationRule !== false && migrationRule.type === 'envRename') {
      envFound = envs[migrationRule.targetSlug]
    }
  }

  const hasEnvOrResource =
    envFound !== undefined || resourceJumpFound !== undefined
  if (hasEnvOrResource) {
    if (envFound === undefined) {
      const [history, availabilityMatrix] = await Promise.all([
        getEnvHistory(),
        getAvailabilityMatrix(),
      ])

      const historyEnvSlugs = history
        .map(
          (historyItem) =>
            envs[historyItem.envSlug] && envs[historyItem.envSlug]?.slug,
        )
        .filter((e) => e !== undefined)
      const alreadyCheckedSlugs = new Set<string>()

      const candidates: Array<AvailabilitySlugPair> = []
      for (const envSlug of historyEnvSlugs) {
        if (alreadyCheckedSlugs.has(envSlug)) {
          continue
        }
        alreadyCheckedSlugs.add(envSlug)

        const jumpResourcePairs = findAvailableResources({
          envSlug,
          resourceJumpSlug: resourceJumpFound
            ? resourceJumpFound.slug
            : undefined,
          availabilityMatrix: availabilityMatrix,
        })

        candidates.push(...jumpResourcePairs)
      }
      const sortedByRelevance = sort(
        candidates,
        ({ availabilityVariant: { isDeployed, hasData, isHealthy } }) =>
          (isDeployed && isHealthy && hasData ? 1 : 0) * 4 +
          (isHealthy ? 1 : 0) * 3 +
          (hasData ? 1 : 0) * 2 +
          (isDeployed ? 1 : 0),
        true,
      )
      const mostRelevantEnvSlug =
        sortedByRelevance.length > 0 ? sortedByRelevance[0]?.envSlug : undefined
      if (mostRelevantEnvSlug) {
        envFound = envs[mostRelevantEnvSlug]
      }
    }
  }

  return {
    resourceJump: resourceJumpFound,
    env: envFound,
  }
}
