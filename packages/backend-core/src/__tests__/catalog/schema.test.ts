// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { getTestCatalogClient, resetCatalog } from '../../testing'

const prisma = getTestCatalogClient()

describe.skipIf(!prisma)('catalog schema', () => {
  beforeEach(() => resetCatalog(prisma!))

  it('drops endpoints with their deployment', async () => {
    // given
    await prisma!.catalogComponent.create({
      data: { slug: 'api', displayName: 'API' },
    })
    await prisma!.catalogDeploymentTarget.create({
      data: { slug: 't1', displayName: 'T1' },
    })
    await prisma!.catalogArtifact.create({
      data: { componentSlug: 'api', version: 'main-1' },
    })
    await prisma!.catalogDeployment.create({
      data: {
        componentSlug: 'api',
        targetSlug: 't1',
        version: 'main-1',
        scope: 's',
        source: 'test',
        endpoints: { create: [{ kind: 'ui', url: 'https://a.example.com' }] },
      },
    })
    // act
    await prisma!.catalogDeployment.deleteMany({})
    // assert
    expect(await prisma!.catalogEndpoint.count()).toBe(0)
  })
})
