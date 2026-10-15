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

describe.skipIf(!prisma)('catalog writes', () => {
  it('keeps one deployment per component per target', async () => {
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
    const rows = await catalog!.listDeployments({ environmentSlug: 'prod' })
    const pairs = rows.map(
      (r: { target: { slug: string }; artifact: { version: string } }) => [
        r.target.slug,
        r.artifact.version,
      ],
    )
    expect(pairs).toEqual([
      ['k8s:prod/shop-eu', 'main-10'],
      ['k8s:prod/shop-us', 'main-11'],
    ])
  })

  it('replace deletes what the scope no longer reports, and only that scope', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.replaceDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
      },
    ])
    await catalog!.replaceDeployments('other', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-us',
        version: 'main-11',
        source: 'other',
      },
    ])
    await catalog!.replaceDeployments('ci', [])
    const slugs = (await catalog!.listDeployments()).map(
      (r: { target: { slug: string } }) => r.target.slug,
    )
    expect(slugs).toEqual(['k8s:prod/shop-us'])
  })

  it('replaces a deployment together with its endpoints', async () => {
    await givenOneComponentOnTwoTargets()
    const eu = {
      componentSlug: 'shop-api',
      targetSlug: 'k8s:prod/shop-eu',
      version: 'main-10',
      source: 'ci',
    }
    await catalog!.replaceDeployments('ci', [
      {
        ...eu,
        endpoints: [{ kind: 'ui' as const, url: 'https://old.example.com' }],
      },
    ])
    await catalog!.replaceDeployments('ci', [
      {
        ...eu,
        endpoints: [
          { kind: 'health' as const, url: 'https://new.example.com/health' },
        ],
      },
    ])
    expect((await catalog!.listDeployments())[0]!.endpoints).toEqual([
      {
        kind: 'health',
        url: 'https://new.example.com/health',
        label: undefined,
      },
    ])
  })

  it('upserted artifacts outlive the release that produced them', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.replaceReleases('ci', [{ key: 'r1', tag: 'v1' }])
    await catalog!.upsertArtifacts([
      { componentSlug: 'shop-api', version: 'main-10', releaseKey: 'r1' },
    ])
    await catalog!.replaceReleases('ci', [])
    const artifact = await prisma!.catalogArtifact.findUnique({
      where: {
        componentSlug_version: {
          componentSlug: 'shop-api',
          version: 'main-10',
        },
      },
    })
    expect(artifact?.releaseKey).toBeNull()
    expect(await prisma!.catalogArtifact.count()).toBe(2)
  })

  it('a deployment of an unknown artifact fails loudly', async () => {
    await givenOneComponentOnTwoTargets()
    await expect(
      catalog!.replaceDeployments('ci', [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop-eu',
          version: 'nope',
          source: 'ci',
        },
      ]),
    ).rejects.toThrow()
  })

  it('replacing deployments cascade-deletes their health', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.replaceDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
      },
    ])
    await catalog!.replaceHealth('probe', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'healthy',
        observedAt: new Date(),
        checker: 'http',
      },
    ])
    await catalog!.replaceDeployments('ci', [])
    expect(await prisma!.catalogHealth.count()).toBe(0)
  })

  it('replacing deployments keeps health for deployments not removed', async () => {
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
        state: 'healthy',
        observedAt: new Date(),
        checker: 'http',
      },
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-us',
        state: 'healthy',
        observedAt: new Date(),
        checker: 'http',
      },
    ])
    await catalog!.replaceDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-us',
        version: 'main-11',
        source: 'ci',
      },
    ])
    const health = await prisma!.catalogHealth.findMany()
    expect(health.map((h) => h.targetSlug)).toEqual(['k8s:prod/shop-us'])
  })

  it('replacing deployments removes endpoints with the deployment', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.replaceDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
        endpoints: [{ kind: 'ui' as const, url: 'https://eu.example.com' }],
      },
    ])
    await catalog!.replaceDeployments('other', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-us',
        version: 'main-11',
        source: 'other',
        endpoints: [{ kind: 'api' as const, url: 'https://us.example.com' }],
      },
    ])
    await catalog!.replaceDeployments('ci', [])
    const endpoints = await prisma!.catalogEndpoint.findMany()
    expect(endpoints.map((e) => e.url)).toEqual(['https://us.example.com'])
  })

  it('endpoint URLs are sanitized: credentials stripped, invalid rejected', async () => {
    await givenOneComponentOnTwoTargets()
    const urlWithCreds = `https://${'admin'}:${'secret'}@shop.example.com/api?key=xyz#frag`
    await catalog!.replaceDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
        endpoints: [{ kind: 'api' as const, url: urlWithCreds }],
      },
    ])
    const stored = await prisma!.catalogEndpoint.findFirst()
    expect(stored?.url).toBe('https://shop.example.com/api')

    await expect(
      catalog!.replaceDeployments('ci', [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop-us',
          version: 'main-11',
          source: 'ci',
          endpoints: [{ kind: 'ui' as const, url: 'not a url' }],
        },
      ]),
    ).rejects.toThrow('Invalid endpoint URL')
  })

  it('a replace takes over a pair another scope held, with its health', async () => {
    await givenOneComponentOnTwoTargets()
    const eu = {
      componentSlug: 'shop-api',
      targetSlug: 'k8s:prod/shop-eu',
      version: 'main-10',
    }
    await catalog!.replaceDeployments('other', [{ ...eu, source: 'other' }])
    await catalog!.replaceHealth('probe', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'healthy',
        observedAt: new Date('2026-01-01'),
        checker: 'http',
      },
    ])
    await catalog!.replaceDeployments('ci', [
      {
        ...eu,
        version: 'main-11',
        source: 'ci',
        endpoints: [{ kind: 'ui' as const, url: 'https://shop.example.com' }],
      },
    ])
    await catalog!.replaceHealth('ci-health', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'down',
        observedAt: new Date('2026-01-02'),
        checker: 'k8s',
      },
    ])
    expect(
      await prisma!.catalogDeployment.findMany({
        select: { scope: true, version: true },
      }),
    ).toEqual([{ scope: 'ci', version: 'main-11' }])
    expect(
      await prisma!.catalogHealth.findMany({
        select: { scope: true, state: true },
      }),
    ).toEqual([{ scope: 'ci-health', state: 'down' }])
    // The scope that lost the pair no longer owns anything to delete.
    await catalog!.replaceDeployments('other', [])
    expect(await prisma!.catalogDeployment.count()).toBe(1)
  })

  it('writes 2,000 deployments with endpoints inside the default transaction timeout', async () => {
    await givenOneComponentOnTwoTargets()
    const targets = Array.from({ length: 2000 }, (_, i) => ({
      slug: `k8s:stage/ns-${i}`,
      displayName: `ns-${i}`,
    }))
    await catalog!.upsertTargets(targets)
    const list = targets.map((t) => ({
      componentSlug: 'shop-api',
      targetSlug: t.slug,
      version: 'main-10',
      source: 'ci',
      endpoints: [
        { kind: 'ui' as const, url: `https://${t.displayName}.example.com` },
        {
          kind: 'health' as const,
          url: `https://${t.displayName}.example.com/health`,
        },
      ],
    }))
    const started = Date.now()
    await catalog!.replaceDeployments('ci', list)
    await catalog!.replaceDeployments('ci', list)
    const elapsed = Date.now() - started
    console.info(`2,000 deployments replaced twice in ${elapsed} ms`)
    expect(await prisma!.catalogDeployment.count()).toBe(2000)
    expect(await prisma!.catalogEndpoint.count()).toBe(4000)
  })
})
