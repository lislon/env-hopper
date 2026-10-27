// @vitest-environment node
/** DeploymentHistory: one row each time what an AppEnv shows changes, written with the change. */
import { beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import {
  getTestCatalogClient,
  resetCatalog,
  withOwnTransactions,
} from '../../testing'

const prisma = getTestCatalogClient()
const catalog = prisma ? withOwnTransactions(createCatalog(prisma)) : undefined

async function givenShopOnProdAndQa() {
  if (!catalog) throw new Error('catalog not ready')
  await catalog.syncEnvironments('ci', [
    { slug: 'prod', displayName: 'Production' },
    { slug: 'qa', displayName: 'QA' },
  ])
  await catalog.syncApps('ci', [{ slug: 'shop', displayName: 'Shop' }])
  await catalog.syncComponents('ci', [
    { slug: 'shop-api', displayName: 'Shop API', appSlug: 'shop' },
  ])
  await catalog.syncTargets('ci', [
    { slug: 'k8s:prod/shop', displayName: 'prod', environmentSlug: 'prod' },
    { slug: 'k8s:qa/shop', displayName: 'qa', environmentSlug: 'qa' },
  ])
  await catalog.syncUsers('ci', [{ username: 'ann' }])
  await catalog.syncArtifacts('ci', [
    { componentSlug: 'shop-api', version: 'main-10' },
    { componentSlug: 'shop-api', version: 'main-11' },
  ])
}

const on = (target: string, version: string, deployedAt: string) => ({
  componentSlug: 'shop-api',
  targetSlug: target,
  version,
  source: 'k8s',
  deployedAt: new Date(deployedAt),
  deployedBy: 'ann',
})

beforeEach(async () => {
  if (prisma) await resetCatalog(prisma)
})

describe.skipIf(!prisma)('deployment history', () => {
  it('keeps a row each time a Deployment appears, changes or goes, and each attempt, never for a run that changes nothing', async () => {
    await givenShopOnProdAndQa()
    const prod10 = on('k8s:prod/shop', 'main-10', '2026-01-01T10:00:00Z')
    const qa10 = on('k8s:qa/shop', 'main-10', '2026-01-01T09:00:00Z')
    await catalog!.syncDeployments('ci', [prod10, qa10])
    // The same run again: no change, no row.
    await catalog!.syncDeployments('ci', [prod10, qa10])
    await catalog!.syncDeployAttempts('attempts:shop-api', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop',
        version: 'main-11',
        status: 'running',
      },
    ])
    await catalog!.syncDeployments('ci', [
      on('k8s:prod/shop', 'main-11', '2026-01-02T10:00:00Z'),
      qa10,
    ])
    // QA's Deployment is gone.
    await catalog!.syncDeployments('ci', [
      on('k8s:prod/shop', 'main-11', '2026-01-02T10:00:00Z'),
    ])

    const history = await createCatalog(prisma!).getDeploymentHistory({
      app: 'shop',
    })
    const prodOnly = await createCatalog(prisma!).getDeploymentHistory({
      app: 'shop',
      env: 'prod',
    })

    expect({
      history: history.map(({ observedAt, ...h }) => h),
      prodOnly: prodOnly.map((h) => `${h.kind} ${h.version ?? ''}`),
    }).toEqual({
      // Newest first.
      history: [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:qa/shop',
          appSlug: 'shop',
          envSlug: 'qa',
          kind: 'removed',
          version: 'main-10',
          source: 'k8s',
          eventAt: '2026-01-01T09:00:00.000Z',
        },
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop',
          appSlug: 'shop',
          envSlug: 'prod',
          kind: 'deployed',
          version: 'main-11',
          previous: 'main-10',
          deployedAt: '2026-01-02T10:00:00.000Z',
          deployedBy: 'ann',
          source: 'k8s',
          eventAt: '2026-01-02T10:00:00.000Z',
        },
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop',
          appSlug: 'shop',
          envSlug: 'prod',
          kind: 'attempt',
          version: 'main-11',
          status: 'running',
        },
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:qa/shop',
          appSlug: 'shop',
          envSlug: 'qa',
          kind: 'deployed',
          version: 'main-10',
          deployedAt: '2026-01-01T09:00:00.000Z',
          deployedBy: 'ann',
          source: 'k8s',
          eventAt: '2026-01-01T09:00:00.000Z',
        },
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop',
          appSlug: 'shop',
          envSlug: 'prod',
          kind: 'deployed',
          version: 'main-10',
          deployedAt: '2026-01-01T10:00:00.000Z',
          deployedBy: 'ann',
          source: 'k8s',
          eventAt: '2026-01-01T10:00:00.000Z',
        },
      ],
      prodOnly: ['deployed main-11', 'attempt main-11', 'deployed main-10'],
    })
  })

  it('a second writer of the same change, one that read the catalog before the first wrote, adds no row', async () => {
    await givenShopOnProdAndQa()
    await catalog!.syncDeployments('ci', [
      on('k8s:prod/shop', 'main-10', '2026-01-01T10:00:00Z'),
    ])
    const deploy11 = on('k8s:prod/shop', 'main-11', '2026-01-02T10:00:00Z')
    await catalog!.syncDeployments('ci', [deploy11])
    // The second pod still saw main-10: it writes the same change again.
    await prisma!.catalogDeployment.updateMany({
      where: { targetSlug: 'k8s:prod/shop' },
      data: {
        version: 'main-10',
        deployedAt: new Date('2026-01-01T10:00:00Z'),
      },
    })
    await catalog!.syncDeployments('ci', [deploy11])

    const history = await createCatalog(prisma!).getDeploymentHistory({
      app: 'shop',
    })
    expect(history.map((h) => `${h.kind} ${h.version} ${h.eventAt}`)).toEqual([
      'deployed main-11 2026-01-02T10:00:00.000Z',
      'deployed main-10 2026-01-01T10:00:00.000Z',
    ])
  })
})
