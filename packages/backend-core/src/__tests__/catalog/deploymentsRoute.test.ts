// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext } from '../../server/ehTrpcContext'
import type { EhBackendCompanySpecificBackend } from '../../types'
import {
  getTestCatalogClient,
  resetCatalog,
  withOwnTransactions,
} from '../../testing'

const prisma = getTestCatalogClient()
const catalog = prisma ? createCatalog(prisma) : undefined
const backend = {} as EhBackendCompanySpecificBackend

const call = (c: typeof catalog | null) =>
  createTrpcRouter().createCaller(
    createEhTrpcContext({
      companySpecificBackend: backend,
      adminGroups: [],
      catalog: c,
    }),
  )

beforeEach(async () => {
  if (prisma) await resetCatalog(prisma)
})

describe('deployments query', () => {
  it('is empty when the deployment keeps no catalog', async () => {
    expect(await call(null).deployments({ appSlug: 'shop' })).toEqual({
      components: [],
      leadComponentSlug: null,
      deployments: [],
    })
  })

  it.skipIf(!prisma)('serves the catalog through the router', async () => {
    const w = withOwnTransactions(catalog!)
    await w.syncEnvironments('ci', [{ slug: 'prod', displayName: 'Prod' }])
    await w.syncApps('ci', [{ slug: 'shop', displayName: 'Shop' }])
    await w.syncComponents('ci', [
      { slug: 'shop-api', displayName: 'Shop API', appSlug: 'shop' },
    ])
    await w.syncTargets('ci', [
      { slug: 'k8s:prod/shop', displayName: 'shop', environmentSlug: 'prod' },
    ])
    await w.syncArtifacts('ci', [
      { componentSlug: 'shop-api', version: 'main-7' },
    ])
    await w.syncDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop',
        version: 'main-7',
        source: 'ci',
      },
    ])
    const out = await call(catalog).deployments({ appSlug: 'shop' })
    expect(out.deployments.map((d) => [d.environmentSlug, d.version])).toEqual([
      ['prod', 'main-7'],
    ])
  })
})
