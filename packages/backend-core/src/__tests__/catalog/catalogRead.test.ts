// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import {
  getTestCatalogClient,
  resetCatalog,
  withOwnTransactions,
} from '../../testing'

const prisma = getTestCatalogClient()
const catalog = prisma ? withOwnTransactions(createCatalog(prisma)) : undefined

async function givenOneComponentOnTwoTargets() {
  if (!catalog) throw new Error('catalog not ready')
  await catalog.syncEnvironments('ci', [
    { slug: 'prod', displayName: 'Production' },
  ])
  await catalog.syncApps('ci', [{ slug: 'shop', displayName: 'Shop' }])
  await catalog.syncComponents('ci', [
    { slug: 'shop-api', displayName: 'Shop API', appSlug: 'shop' },
  ])
  await catalog.syncTargets('ci', [
    { slug: 'k8s:prod/shop-eu', displayName: 'EU', environmentSlug: 'prod' },
    { slug: 'k8s:prod/shop-us', displayName: 'US', environmentSlug: 'prod' },
  ])
  await catalog.syncArtifacts('ci', [
    {
      componentSlug: 'shop-api',
      version: 'main-10',
      builtAt: new Date('2026-01-01'),
    },
    {
      componentSlug: 'shop-api',
      version: 'main-11',
      builtAt: new Date('2026-01-02'),
    },
  ])
}

beforeEach(async () => {
  if (prisma) await resetCatalog(prisma)
})

describe.skipIf(!prisma)('catalog reads', () => {
  it('alias resolves to most recently built', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncArtifacts('ci', [
      {
        componentSlug: 'shop-api',
        version: 'main-10',
        aliases: ['spring'],
        builtAt: new Date('2026-01-01'),
      },
      {
        componentSlug: 'shop-api',
        version: 'main-11',
        aliases: ['spring'],
        builtAt: new Date('2026-01-02'),
      },
    ])
    expect((await catalog!.resolveAlias('shop-api', 'spring'))?.version).toBe(
      'main-11',
    )
  })

  it('after a rollback is re-observed, the alias still names the newest build', async () => {
    await givenOneComponentOnTwoTargets()
    // Each run reports every Artifact it sees, as a sync does.
    const run = (tenAt: Date) =>
      catalog!.syncArtifacts('ci', [
        {
          componentSlug: 'shop-api',
          version: 'main-10',
          aliases: ['spring'],
          builtAt: tenAt,
        },
        {
          componentSlug: 'shop-api',
          version: 'main-11',
          aliases: ['spring'],
          builtAt: new Date('2026-01-02'),
        },
      ])
    await run(new Date('2026-01-01'))
    // Rolled back to main-10; a later run reports it with a later time.
    await run(new Date('2026-01-03'))
    expect((await catalog!.resolveAlias('shop-api', 'spring'))?.version).toBe(
      'main-11',
    )
  })

  it('lists health beside the deployment, unknown when none was observed', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
      },
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-us',
        version: 'main-11',
        source: 'ci',
      },
    ])
    await catalog!.syncHealth('probe', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'down',
        observedAt: new Date('2026-01-03'),
        checker: 'http',
      },
    ])
    const states = (await catalog!.listDeployments()).map(
      (d: { health: { state: string } | null }) => d.health?.state ?? 'unknown',
    )
    expect(states).toEqual(['down', 'unknown'])
  })

  it('filters by app', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
      },
    ])
    expect(await catalog!.listDeployments({ appSlug: 'other' })).toEqual([])
  })

  it('health without a deployment is never returned', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncHealth('probe', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'healthy',
        observedAt: new Date(),
        checker: 'http',
      },
    ])
    expect(await catalog!.listDeployments()).toEqual([])
  })

  it('alias with no builtAt sorts last', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncArtifacts('ci', [
      { componentSlug: 'shop-api', version: 'main-12', aliases: ['latest'] },
      {
        componentSlug: 'shop-api',
        version: 'main-13',
        aliases: ['latest'],
        builtAt: new Date('2026-01-01'),
      },
    ])
    expect((await catalog!.resolveAlias('shop-api', 'latest'))?.version).toBe(
      'main-13',
    )
  })

  it('alias tie in builtAt breaks tie by version desc', async () => {
    await givenOneComponentOnTwoTargets()
    const sameBuildTime = new Date('2026-01-01')
    await catalog!.syncArtifacts('ci', [
      {
        componentSlug: 'shop-api',
        version: 'main-10',
        aliases: ['snapshot'],
        builtAt: sameBuildTime,
      },
      {
        componentSlug: 'shop-api',
        version: 'main-11',
        aliases: ['snapshot'],
        builtAt: sameBuildTime,
      },
    ])
    const resolved = await catalog!.resolveAlias('shop-api', 'snapshot')
    expect(resolved?.version).toBe('main-11')
  })
})
