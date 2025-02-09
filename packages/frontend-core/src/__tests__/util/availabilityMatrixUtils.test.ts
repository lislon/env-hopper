import { expect, it } from 'vitest'
import type { AvailabilityVariant } from '@env-hopper/backend-core'
import { findAvailableResources } from '~/util/availabilityMatrixUtils'

const variantHealthy: AvailabilityVariant = {
  isDeployed: true,
  hasData: true,
  isHealthy: true,
}
const variantMissing: AvailabilityVariant = {
  isDeployed: false,
  hasData: false,
  isHealthy: false,
}

const matrixData = {
  envSlugs: ['env1', 'env2'],
  resourceJumpSlugs: ['res1', 'res2'],
  availabilityVariants: [variantHealthy, variantMissing],
  matrix: [
    [0, 1],
    [1, 0],
  ],
}
it('finds available resources by envSlug', () => {
  const result = findAvailableResources({
    envSlug: 'env1',
    availabilityMatrix: matrixData,
  })
  expect(result).toEqual([
    {
      envSlug: 'env1',
      resourceJumpSlug: 'res1',
      availabilityVariant: variantHealthy,
    },
    {
      envSlug: 'env1',
      resourceJumpSlug: 'res2',
      availabilityVariant: variantMissing,
    },
  ])
})

it('finds available resources by resourceJumpSlug', () => {
  const result = findAvailableResources({
    resourceJumpSlug: 'res1',
    availabilityMatrix: matrixData,
  })
  expect(result).toEqual([
    {
      envSlug: 'env1',
      resourceJumpSlug: 'res1',
      availabilityVariant: variantHealthy,
    },
    {
      envSlug: 'env2',
      resourceJumpSlug: 'res1',
      availabilityVariant: variantMissing,
    },
  ])
})
