import type {
  AvailabilityVariant,
  AvailiabilityMatrixData,
} from '@env-hopper/backend-core'

export interface AvailabilitySearchParams {
  envSlug?: string
  resourceJumpSlug?: string
  availabilityMatrix: AvailiabilityMatrixData
}

export interface AvailabilitySlugPair {
  envSlug: string
  resourceJumpSlug: string
  availabilityVariant: AvailabilityVariant
}

export function findAvailableResources({
  resourceJumpSlug,
  envSlug,
  availabilityMatrix,
}: AvailabilitySearchParams): Array<AvailabilitySlugPair> {
  const { availabilityVariants, envSlugs, matrix, resourceJumpSlugs } =
    availabilityMatrix

  let pairs: Array<AvailabilitySlugPair> = []

  if (envSlug !== undefined) {
    const envIdx = envSlugs.findIndex((slug) => slug === envSlug)
    if (envIdx !== -1) {
      pairs =
        matrix[envIdx]?.flatMap((variantIdx, resourceIdx) => {
          const resourceJumpSlugFound = resourceJumpSlugs[resourceIdx]
          const availabilityVariant = availabilityVariants[variantIdx]
          if (
            resourceJumpSlugFound === undefined ||
            availabilityVariant === undefined
          ) {
            return []
          }
          return [
            {
              envSlug,
              resourceJumpSlug: resourceJumpSlugFound,
              availabilityVariant,
            },
          ]
        }) || []
    }
    if (resourceJumpSlug !== undefined) {
      pairs = pairs.filter((pair) => pair.resourceJumpSlug === resourceJumpSlug)
    }
  } else if (resourceJumpSlug !== undefined) {
    const resourceIdx = resourceJumpSlugs.findIndex(
      (resource) => resource === resourceJumpSlug,
    )
    if (resourceIdx !== -1) {
      pairs = matrix.flatMap((resourceJumps, envIdx) => {
        const variantIdx = resourceJumps[resourceIdx]
        const foundEnvSlug = envSlugs[envIdx]
        const availabilityVariant =
          variantIdx !== undefined
            ? availabilityVariants[variantIdx]
            : undefined

        if (foundEnvSlug == null || availabilityVariant == null) {
          return []
        }
        return [
          {
            envSlug: foundEnvSlug,
            resourceJumpSlug,
            availabilityVariant,
          },
        ]
      })
    }
  }
  return pairs
}
