// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import type { ChangeRequestRef } from '../../catalog'
import {
  getTestCatalogClient,
  resetCatalog,
  withOwnTransactions,
} from '../../testing'

const prisma = getTestCatalogClient()
const catalog = prisma ? withOwnTransactions(createCatalog(prisma)) : undefined

const mr42: ChangeRequestRef = {
  id: '42',
  url: 'https://git.example.com/shop/-/merge_requests/42',
  title: 'Add the basket',
  workItems: ['SHOP-7'],
  direct: true,
}

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

describe.skipIf(!prisma)('catalog writes', () => {
  it('keeps one deployment per component per target', async () => {
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
    const rows = await catalog!.listDeployments({ environmentSlugs: ['prod'] })
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

  it('a sync deletes what the scope no longer reports, and only that scope', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
      },
    ])
    await catalog!.syncDeployments('other', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-us',
        version: 'main-11',
        source: 'other',
      },
    ])
    await catalog!.syncDeployments('ci', [])
    const slugs = (await catalog!.listDeployments()).map(
      (r: { target: { slug: string } }) => r.target.slug,
    )
    expect(slugs).toEqual(['k8s:prod/shop-us'])
  })

  it('syncs a deployment together with its endpoints', async () => {
    await givenOneComponentOnTwoTargets()
    const eu = {
      componentSlug: 'shop-api',
      targetSlug: 'k8s:prod/shop-eu',
      version: 'main-10',
      source: 'ci',
    }
    await catalog!.syncDeployments('ci', [
      {
        ...eu,
        endpoints: [{ kind: 'ui' as const, url: 'https://old.example.com' }],
      },
    ])
    await catalog!.syncDeployments('ci', [
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

  it('artifacts outlive the release that produced them', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncReleases('ci', [{ key: 'r1', tag: 'v1' }])
    await catalog!.syncArtifacts('ci', [
      { componentSlug: 'shop-api', version: 'main-10', releaseKey: 'r1' },
      { componentSlug: 'shop-api', version: 'main-11' },
    ])
    await catalog!.syncReleases('ci', [])
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

  it('an unchanged row keeps its updatedAt and a changed row moves it', async () => {
    await givenOneComponentOnTwoTargets()
    const stamps = async () =>
      Object.fromEntries(
        (await prisma!.catalogDeploymentTarget.findMany()).map((t) => [
          t.slug,
          t.updatedAt.getTime(),
        ]),
      )
    const before = await stamps()
    await new Promise((r) => setTimeout(r, 20))
    await catalog!.syncTargets('ci', [
      { slug: 'k8s:prod/shop-eu', displayName: 'EU', environmentSlug: 'prod' },
      {
        slug: 'k8s:prod/shop-us',
        displayName: 'US East',
        environmentSlug: 'prod',
      },
    ])
    const after = await stamps()
    expect(after['k8s:prod/shop-eu']).toBe(before['k8s:prod/shop-eu'])
    expect(after['k8s:prod/shop-us']).toBeGreaterThan(
      before['k8s:prod/shop-us']!,
    )
  })

  it('a stale artifact is deleted with its stale deployment and health', async () => {
    await givenOneComponentOnTwoTargets()
    const eu = {
      componentSlug: 'shop-api',
      targetSlug: 'k8s:prod/shop-eu',
      source: 'ci',
    }
    await catalog!.syncDeployments('ci', [{ ...eu, version: 'main-10' }])
    await catalog!.syncHealth('probe', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'healthy',
        observedAt: new Date(),
        checker: 'http',
      },
    ])
    // The next run no longer sees main-10 anywhere.
    await catalog!.syncArtifacts('ci', [
      { componentSlug: 'shop-api', version: 'main-11' },
    ])
    expect(await prisma!.catalogArtifact.count()).toBe(1)
    expect(await prisma!.catalogDeployment.count()).toBe(0)
    expect(await prisma!.catalogHealth.count()).toBe(0)
  })

  it('a sync takes over a row another scope held', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncApps('other', [{ slug: 'shop', displayName: 'Shop 2' }])
    expect(
      await prisma!.catalogApp.findMany({
        select: { slug: true, scope: true, displayName: true },
      }),
    ).toEqual([{ slug: 'shop', scope: 'other', displayName: 'Shop 2' }])
    // The scope that lost the row no longer owns anything to delete.
    await catalog!.syncApps('ci', [])
    expect(await prisma!.catalogApp.count()).toBe(1)
  })

  it('an artifact keeps the earliest build time any run reported', async () => {
    await givenOneComponentOnTwoTargets()
    const builtAt = async () =>
      (
        await prisma!.catalogArtifact.findUniqueOrThrow({
          where: {
            componentSlug_version: {
              componentSlug: 'shop-api',
              version: 'main-10',
            },
          },
        })
      ).builtAt
    const sync = (ten: { builtAt?: Date; aliases?: Array<string> }) =>
      catalog!.syncArtifacts('ci', [
        { componentSlug: 'shop-api', version: 'main-10', ...ten },
        { componentSlug: 'shop-api', version: 'main-11' },
      ])
    await sync({ builtAt: new Date('2026-03-01') })
    expect(await builtAt()).toEqual(new Date('2026-01-01'))
    await sync({ aliases: ['spring'] })
    expect(await builtAt()).toEqual(new Date('2026-01-01'))
    await sync({ builtAt: new Date('2025-12-31') })
    expect(await builtAt()).toEqual(new Date('2025-12-31'))
  })

  it('a build time beats a deploy time, whichever is earlier, and says which it is', async () => {
    await givenOneComponentOnTwoTargets()
    const stored = async () =>
      prisma!.catalogArtifact.findUniqueOrThrow({
        where: {
          componentSlug_version: { componentSlug: 'shop-api', version: 'v9' },
        },
        select: { builtAt: true, builtAtSource: true, changeRequest: true },
      })
    const sync = (a: {
      builtAt?: Date
      builtAtSource?: 'build' | 'deploy'
      changeRequest?: ChangeRequestRef
    }) =>
      catalog!.syncArtifacts('ci', [
        { componentSlug: 'shop-api', version: 'v9', ...a },
      ])
    await sync({
      builtAt: new Date('2026-02-01'),
      builtAtSource: 'deploy',
      changeRequest: mr42,
    })
    expect(await stored()).toEqual({
      builtAt: new Date('2026-02-01'),
      builtAtSource: 'deploy',
      changeRequest: mr42,
    })
    await sync({ builtAt: new Date('2026-03-01') })
    expect(await stored()).toMatchObject({
      builtAt: new Date('2026-03-01'),
      builtAtSource: 'build',
    })
    await sync({ builtAt: new Date('2026-01-01'), builtAtSource: 'deploy' })
    expect(await stored()).toMatchObject({
      builtAt: new Date('2026-03-01'),
      builtAtSource: 'build',
    })
  })

  it('the same change request again, its keys in another order, is no change', async () => {
    await givenOneComponentOnTwoTargets()
    const sync = (changeRequest: ChangeRequestRef) =>
      catalog!.syncArtifacts('ci', [
        { componentSlug: 'shop-api', version: 'v9', changeRequest },
      ])
    await sync(mr42)

    const again = await sync({
      direct: true,
      workItems: ['SHOP-7'],
      title: 'Add the basket',
      url: mr42.url,
      id: '42',
    })

    expect(again).toEqual({ created: 0, updated: 0, deleted: 0, unchanged: 1 })
  })

  it('an artifact first seen without a build time takes the first one reported', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncArtifacts('ci', [
      { componentSlug: 'shop-api', version: 'main-12' },
    ])
    await catalog!.syncArtifacts('ci', [
      {
        componentSlug: 'shop-api',
        version: 'main-12',
        builtAt: new Date('2026-02-01'),
      },
    ])
    const row = await prisma!.catalogArtifact.findUniqueOrThrow({
      where: {
        componentSlug_version: {
          componentSlug: 'shop-api',
          version: 'main-12',
        },
      },
    })
    expect(row.builtAt).toEqual(new Date('2026-02-01'))
  })

  it('a deployment of an unknown artifact fails loudly', async () => {
    await givenOneComponentOnTwoTargets()
    await expect(
      catalog!.syncDeployments('ci', [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop-eu',
          version: 'nope',
          source: 'ci',
        },
      ]),
    ).rejects.toThrow()
  })

  it('syncing deployments cascade-deletes their health', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
      },
    ])
    await catalog!.syncHealth('probe', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'healthy',
        observedAt: new Date(),
        checker: 'http',
      },
    ])
    await catalog!.syncDeployments('ci', [])
    expect(await prisma!.catalogHealth.count()).toBe(0)
  })

  it('syncing deployments keeps health for deployments not removed', async () => {
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
    await catalog!.syncDeployments('ci', [
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

  it('syncing deployments removes endpoints with the deployment', async () => {
    await givenOneComponentOnTwoTargets()
    await catalog!.syncDeployments('ci', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        version: 'main-10',
        source: 'ci',
        endpoints: [{ kind: 'ui' as const, url: 'https://eu.example.com' }],
      },
    ])
    await catalog!.syncDeployments('other', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-us',
        version: 'main-11',
        source: 'other',
        endpoints: [{ kind: 'api' as const, url: 'https://us.example.com' }],
      },
    ])
    await catalog!.syncDeployments('ci', [])
    const endpoints = await prisma!.catalogEndpoint.findMany()
    expect(endpoints.map((e) => e.url)).toEqual(['https://us.example.com'])
  })

  it('endpoint URLs are sanitized: credentials stripped, invalid rejected', async () => {
    await givenOneComponentOnTwoTargets()
    const urlWithCreds = `https://${'admin'}:${'secret'}@shop.example.com/api?key=xyz#frag`
    await catalog!.syncDeployments('ci', [
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
      catalog!.syncDeployments('ci', [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop-us',
          version: 'main-11',
          source: 'ci',
          endpoints: [{ kind: 'ui' as const, url: 'not a url' }],
        },
      ]),
    ).rejects.toThrow(/^Invalid endpoint URL for shop-api\/k8s:prod\/shop-us$/)
  })

  it('a sync takes over a pair another scope held, with its health', async () => {
    await givenOneComponentOnTwoTargets()
    const eu = {
      componentSlug: 'shop-api',
      targetSlug: 'k8s:prod/shop-eu',
      version: 'main-10',
    }
    await catalog!.syncDeployments('other', [{ ...eu, source: 'other' }])
    await catalog!.syncHealth('probe', [
      {
        componentSlug: 'shop-api',
        targetSlug: 'k8s:prod/shop-eu',
        state: 'healthy',
        observedAt: new Date('2026-01-01'),
        checker: 'http',
      },
    ])
    await catalog!.syncDeployments('ci', [
      {
        ...eu,
        version: 'main-11',
        source: 'ci',
        endpoints: [{ kind: 'ui' as const, url: 'https://shop.example.com' }],
      },
    ])
    await catalog!.syncHealth('ci-health', [
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
    await catalog!.syncDeployments('other', [])
    expect(await prisma!.catalogDeployment.count()).toBe(1)
  })

  it('syncs 2,000 deployments with endpoints inside the transaction timeout', async () => {
    await givenOneComponentOnTwoTargets()
    const targets = Array.from({ length: 2000 }, (_, i) => ({
      slug: `k8s:stage/ns-${i}`,
      displayName: `ns-${i}`,
    }))
    await catalog!.syncTargets('ci', targets)
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
    await catalog!.syncDeployments('ci', list)
    await catalog!.syncDeployments('ci', list)
    const elapsed = Date.now() - started
    console.info(`2,000 deployments synced twice in ${elapsed} ms`)
    expect(await prisma!.catalogDeployment.count()).toBe(2000)
    expect(await prisma!.catalogEndpoint.count()).toBe(4000)

    await catalog!.syncHealth(
      'ci',
      list.map((d) => ({
        componentSlug: d.componentSlug,
        targetSlug: d.targetSlug,
        state: 'healthy' as const,
        observedAt: new Date(),
        checker: 'http',
      })),
    )
    const listed = await catalog!.listDeployments()
    expect(listed.filter((d) => d.health?.state === 'healthy')).toHaveLength(
      2000,
    )
    // The bound under test is the sync's own transaction timeout; vitest's 5 s
    // default only measures the CI runner's speed.
  }, 60_000)

  it('a run whose deployment sync fails leaves the artifacts as they were', async () => {
    await givenOneComponentOnTwoTargets()
    const raw = createCatalog(prisma!)

    const run = raw.transaction(async (tx) => {
      await raw.syncArtifacts(tx, 'ci', [
        { componentSlug: 'shop-api', version: 'main-12' },
      ])
      await raw.syncDeployments(tx, 'ci', [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop-eu',
          version: 'no-such-artifact',
          source: 'gitops',
        },
      ])
    })

    await expect(run).rejects.toThrow()
    const versions = await prisma!.catalogArtifact.findMany({
      select: { version: true },
      orderBy: { version: 'asc' },
    })
    expect(versions.map((a) => a.version)).toEqual(['main-10', 'main-11'])
  })

  it('every sync reports what it did to its table', async () => {
    await givenOneComponentOnTwoTargets()

    const counts = await catalog!.syncArtifacts('ci', [
      {
        componentSlug: 'shop-api',
        version: 'main-10',
        builtAt: new Date('2026-01-01'),
      },
      { componentSlug: 'shop-api', version: 'main-11', aliases: ['latest'] },
      { componentSlug: 'shop-api', version: 'main-12' },
    ])

    expect(counts).toEqual({ created: 1, updated: 1, deleted: 0, unchanged: 1 })
    expect(
      await catalog!.syncArtifacts('ci', [
        { componentSlug: 'shop-api', version: 'main-12' },
      ]),
    ).toEqual({ created: 0, updated: 0, deleted: 2, unchanged: 1 })
  })

  it('upsertOnly writes the list and deletes nothing the scope held', async () => {
    await givenOneComponentOnTwoTargets()
    const a = {
      slug: 'k8s:prod/shop-eu',
      displayName: 'EU',
      environmentSlug: 'prod',
    }
    const b = { ...a, slug: 'k8s:prod/shop-us', displayName: 'US' }

    const counts = await catalog!.syncTargets(
      'ci',
      [{ ...a, displayName: 'Europe' }],
      { upsertOnly: true },
    )

    expect(counts).toEqual({ created: 0, updated: 1, deleted: 0, unchanged: 0 })
    const targets = await prisma!.catalogDeploymentTarget.findMany({
      select: { slug: true, displayName: true },
      orderBy: { slug: 'asc' },
    })
    expect(targets).toEqual([
      { slug: a.slug, displayName: 'Europe' },
      { slug: b.slug, displayName: 'US' },
    ])
  })

  it('upsertOnly deployments keep the endpoints of deployments not listed', async () => {
    await givenOneComponentOnTwoTargets()
    const eu = {
      componentSlug: 'shop-api',
      targetSlug: 'k8s:prod/shop-eu',
      version: 'main-10',
      source: 'ci',
      endpoints: [{ kind: 'ui' as const, url: 'https://eu.example.test' }],
    }
    const us = {
      ...eu,
      targetSlug: 'k8s:prod/shop-us',
      endpoints: [{ kind: 'ui' as const, url: 'https://us.example.test' }],
    }
    await catalog!.syncDeployments('ci', [eu, us])

    const counts = await catalog!.syncDeployments(
      'ci',
      [{ ...eu, version: 'main-11', endpoints: [] }],
      { upsertOnly: true },
    )

    expect(counts.deleted).toBe(0)
    const endpoints = await prisma!.catalogEndpoint.findMany({
      select: { targetSlug: true },
    })
    expect(endpoints).toEqual([{ targetSlug: us.targetSlug }])
  })

  describe('Deploy Attempts', () => {
    const failedOnEu = {
      componentSlug: 'shop-api',
      targetSlug: 'k8s:prod/shop-eu',
      version: 'main-11',
      status: 'failed' as const,
      endedAt: new Date('2026-01-03T10:00:00Z'),
    }
    /** The pairs each committed change reported, in order. */
    function changesHeard() {
      const heard: Array<Array<{ app: string; env: string }>> = []
      catalog!.onChange((c) => heard.push(c.pairs))
      return heard
    }

    it('a sync that no longer reports an attempt deletes it, and the pair changed', async () => {
      await givenOneComponentOnTwoTargets()
      await catalog!.syncDeployAttempts('attempts:shop-api', [failedOnEu])
      const heard = changesHeard()

      await catalog!.syncDeployAttempts('attempts:shop-api', [])

      expect({
        attempts: await prisma!.catalogDeployAttempt.count(),
        heard,
      }).toEqual({ attempts: 0, heard: [[{ app: 'shop', env: 'prod' }]] })
    })

    it('the same attempts again change nothing', async () => {
      await givenOneComponentOnTwoTargets()
      await catalog!.syncDeployAttempts('attempts:shop-api', [failedOnEu])
      const heard = changesHeard()

      const counts = await catalog!.syncDeployAttempts('attempts:shop-api', [
        failedOnEu,
      ])

      expect({ counts, heard }).toEqual({
        counts: { created: 0, updated: 0, deleted: 0, unchanged: 1 },
        heard: [],
      })
    })

    it("deleting the attempt's Artifact deletes the attempt, and the pair changed", async () => {
      await givenOneComponentOnTwoTargets()
      await catalog!.syncDeployAttempts('attempts:shop-api', [failedOnEu])
      const heard = changesHeard()

      await catalog!.syncArtifacts('ci', [
        { componentSlug: 'shop-api', version: 'main-10' },
      ])

      expect({
        attempts: await prisma!.catalogDeployAttempt.count(),
        heard,
      }).toEqual({ attempts: 0, heard: [[{ app: 'shop', env: 'prod' }]] })
    })
  })
})
