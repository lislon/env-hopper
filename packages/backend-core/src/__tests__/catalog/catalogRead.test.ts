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
    expect(await catalog!.listDeployments({ appSlugs: ['other'] })).toEqual([])
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

  describe('pair deployments', () => {
    async function givenShopDeployedOn(
      targets: Array<{
        slug: string
        retired?: boolean
        meta?: Record<string, string>
      }>,
    ) {
      await givenOneComponentOnTwoTargets()
      await catalog!.syncTargets(
        'ci',
        targets.map((t) => ({
          slug: t.slug,
          displayName: t.slug,
          environmentSlug: 'prod',
          meta: t.retired ? { retired: 'true' } : t.meta,
        })),
      )
      await catalog!.syncUsers('ci', [
        { username: 'jdoe', firstName: 'Jo', lastName: 'Doe' },
      ])
      await catalog!.syncArtifacts('ci', [
        {
          componentSlug: 'shop-api',
          version: 'main-10',
          buildUrl: 'https://ci.example.com/p/10',
        },
        { componentSlug: 'shop-api', version: 'main-11' },
      ])
      await catalog!.syncDeployments(
        'ci',
        targets.map((t, i) => ({
          componentSlug: 'shop-api',
          targetSlug: t.slug,
          version: i === 0 ? 'main-10' : 'main-11',
          source: 'ci',
          deployedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          deployedBy: 'jdoe',
          deployUrl: `https://ci.example.com/d/${i}`,
        })),
      )
    }

    it('returns the deployer, links and ISO dates, users by username', async () => {
      await givenShopDeployedOn([{ slug: 'k8s:prod/shop' }])
      expect(await catalog!.getPairDeployments({ appSlugs: ['shop'] })).toEqual(
        {
          pairs: [
            {
              app: 'shop',
              env: 'prod',
              users: { jdoe: { firstName: 'Jo', lastName: 'Doe' } },
              rows: [
                {
                  componentSlug: 'shop-api',
                  targetSlug: 'k8s:prod/shop',
                  version: 'main-10',
                  aliases: [],
                  buildUrl: 'https://ci.example.com/p/10',
                  deployedAt: '2026-01-01T10:00:00.000Z',
                  deployedBy: 'jdoe',
                  deployUrl: 'https://ci.example.com/d/0',
                  source: 'ci',
                },
              ],
            },
          ],
        },
      )
    })

    it("names the cluster, namespace and kube context the Target's meta gives", async () => {
      await givenShopDeployedOn([
        {
          slug: 'k8s:east/shop',
          meta: { cluster: 'east', namespace: 'shop-1', kubeContext: 'e1' },
        },
      ])
      const { pairs } = await catalog!.getPairDeployments({})
      expect(pairs[0]!.rows[0]).toMatchObject({
        cluster: 'east',
        namespace: 'shop-1',
        kubeContext: 'e1',
      })
    })

    it('a live Target wins over a retired one, even when the retired deploy is newer', async () => {
      await givenShopDeployedOn([
        { slug: 'k8s:prod/shop' },
        { slug: 'old:shop', retired: true },
      ])
      const { pairs } = await catalog!.getPairDeployments({})
      expect(pairs[0]!.rows.map((d) => [d.targetSlug, d.version])).toEqual([
        ['k8s:prod/shop', 'main-10'],
      ])
    })

    it('filters by Environment too; a Component deployed nowhere has Components and no pair', async () => {
      await givenShopDeployedOn([{ slug: 'k8s:prod/shop' }])
      expect(
        (await catalog!.getPairDeployments({ envSlugs: ['qa'] })).pairs,
      ).toEqual([])
      expect(
        (await catalog!.getPairDeployments({ envSlugs: ['prod'] })).pairs,
      ).toHaveLength(1)
      await resetCatalog(prisma!)
      await givenOneComponentOnTwoTargets()
      expect(
        await catalog!.getPairDeployments({ appSlugs: ['shop', 'unknown'] }),
      ).toEqual({ pairs: [] })
      expect(
        await catalog!.getComponents({ appSlugs: ['shop', 'unknown'] }),
      ).toEqual({
        shop: [{ slug: 'shop-api', displayName: 'Shop API', lead: true }],
      })
    })

    it('marks the lead Component the App was given', async () => {
      await givenOneComponentOnTwoTargets()
      await catalog!.syncComponents('ci', [
        { slug: 'shop-api', displayName: 'Shop API', appSlug: 'shop' },
        { slug: 'shop-ui', displayName: 'Shop UI', appSlug: 'shop' },
      ])
      await catalog!.syncApps('ci', [
        { slug: 'shop', displayName: 'Shop', leadComponentSlug: 'shop-ui' },
      ])
      expect(await catalog!.getComponents({ appSlugs: ['shop'] })).toEqual({
        shop: [
          { slug: 'shop-api', displayName: 'Shop API' },
          { slug: 'shop-ui', displayName: 'Shop UI', lead: true },
        ],
      })
    })

    it('gives a Component the pipelineUrl most of its links fit, the same whatever is read', async () => {
      // Two deploy links on /d/, one build link on /p/.
      await givenShopDeployedOn([
        { slug: 'k8s:prod/a' },
        { slug: 'k8s:prod/b' },
      ])
      const shop = [
        {
          slug: 'shop-api',
          displayName: 'Shop API',
          lead: true,
          pipelineUrl: 'https://ci.example.com/d/{{id}}',
        },
      ]
      expect(await catalog!.getComponents({ appSlugs: ['shop'] })).toEqual({
        shop,
      })
      expect((await catalog!.getComponents({})).shop).toEqual(shop)
    })

    it('breaks a tie between two links by name', async () => {
      await givenShopDeployedOn([{ slug: 'k8s:prod/a' }])
      expect(
        (await catalog!.getComponents({ appSlugs: ['shop'] })).shop?.[0]
          ?.pipelineUrl,
      ).toBe('https://ci.example.com/d/{{id}}')
    })

    it('deleting the User keeps the Deployment, without a deployer', async () => {
      await givenShopDeployedOn([{ slug: 'k8s:prod/shop' }])
      await catalog!.syncUsers('ci', [])
      const [pair] = (await catalog!.getPairDeployments({})).pairs
      expect(pair?.rows[0]?.deployedBy).toBeUndefined()
      expect(pair?.users).toEqual({})
    })
  })
})
