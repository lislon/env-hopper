// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import { getTestCatalogClient, resetCatalog } from './testDb'

const prisma = getTestCatalogClient()
const catalog = prisma ? createCatalog(prisma) : undefined

async function givenOneComponentOnTwoTargets() {
  if (!catalog) throw new Error('catalog not ready')
  await catalog.upsertEnvironments([
    { slug: 'prod', displayName: 'Production' },
  ])
  await catalog.upsertApps([{ slug: 'shop', displayName: 'Shop' }])
  await catalog.upsertComponents([
    { slug: 'shop-api', displayName: 'Shop API', appSlug: 'shop' },
  ])
  await catalog.upsertTargets([
    { slug: 'k8s:prod/shop-eu', displayName: 'EU', environmentSlug: 'prod' },
    { slug: 'k8s:prod/shop-us', displayName: 'US', environmentSlug: 'prod' },
  ])
  await catalog.upsertArtifacts([
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
    await catalog!.upsertArtifacts([
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

  it('lists health beside the deployment, unknown when none was observed', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.replaceDeployments('ci', [
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
    await catalog!.replaceHealth('probe', [
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
    await catalog!.replaceDeployments('ci', [
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
    await catalog!.replaceHealth('probe', [
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
    await catalog!.upsertArtifacts([
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
    await catalog!.upsertArtifacts([
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
