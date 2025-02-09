import type {
  AvailabilityVariant,
  AvailiabilityMatrixData,
  EhAppIndexed,
  EhEnvIndexed,
} from '@env-hopper/backend-core'
import Rand from 'rand-seed'

export interface RandomAvailablityMatrixParams {
  apps: EhAppIndexed[]
  envs: EhEnvIndexed[]
}

export function makeResouceJumpSlugFromAppAndPage(
  app: { slug: string; ui?: { pages?: { slug: string }[] } },
  page: { slug: string },
) {
  const singlePageApp = app.ui?.pages?.length === 1
  return (singlePageApp ? app.slug : app.slug + '-' + page.slug).toLowerCase()
}

export function getResourceJumpsFromApp(app: EhAppIndexed): string[] {
  return (
    app.ui?.pages?.map((page) => {
      return makeResouceJumpSlugFromAppAndPage(app, page)
    }) || []
  )
}

export function getRandomAvailabilityMatrix(
  params: RandomAvailablityMatrixParams,
): AvailiabilityMatrixData {
  const { apps, envs } = params

  const resourceJumpsSlugs = apps.flatMap(getResourceJumpsFromApp)

  const variants: (AvailabilityVariant & { weight: number })[] = [
    {
      isDeployed: true,
      isHealthy: true,
      hasData: true,
      weight: 30,
    },
    {
      isDeployed: true,
      isHealthy: true,
      hasData: false,
      weight: 10,
    },
    {
      isDeployed: false,
      weight: 50,
    },
    {
      isDeployed: true,
      isHealthy: false,
      weight: 10,
    },
  ]

  // get me random numbers with seed
  const rand = new Rand('fixed-seed-for-tests') // fixed seed for tests;

  const selectRandomVariantIndex = () => {
    const totalWeight = variants.reduce(
      (sum, variant) => sum + variant.weight,
      0,
    )
    const random = rand.next() * totalWeight
    let cumulativeWeight = 0
    for (const [index, variant] of variants.entries()) {
      cumulativeWeight += variant.weight
      if (random < cumulativeWeight) {
        return index
      }
    }
    return 0
  }

  return {
    resourceJumpSlugs: resourceJumpsSlugs,
    envSlugs: envs.map((env) => env.slug),
    availabilityVariants: variants.map(({ weight, ...rest }) => rest),
    matrix: envs.map(() =>
      resourceJumpsSlugs.map(() => selectRandomVariantIndex()),
    ),
  }
}
