// @vitest-environment node
/**
 * `pairsWatch` against a real catalog: a committed write pushes the changed
 * pairs in scope, and a client back from an outage catches up.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext } from '../../server/ehTrpcContext'
import { getTestCatalogClient, resetCatalog } from '../../testing'
import type { Catalog, CatalogDeploymentInput } from '../../catalog'
import type { EhBackendCompanySpecificBackend } from '../../types'
import type { PairChunk } from '../../server/pairDetails'

const prisma = getTestCatalogClient()
const catalog = prisma ? createCatalog(prisma) : undefined
const backend = {
  getResourceJumps: () =>
    Promise.resolve({ resourceJumps: [], envs: [], lateResolvableParams: [] }),
} as unknown as EhBackendCompanySpecificBackend

const deployment = (
  componentSlug: string,
  targetSlug: string,
  version: string,
): CatalogDeploymentInput => ({
  componentSlug,
  targetSlug,
  version,
  source: 'ci',
})

/** Two Apps, each one Component, both on prod and qa. */
async function givenTwoApps(c: Catalog) {
  await c.transaction(async (tx) => {
    await c.syncEnvironments(tx, 'ci', [
      { slug: 'prod', displayName: 'Prod' },
      { slug: 'qa', displayName: 'QA' },
    ])
    await c.syncApps(tx, 'ci', [
      { slug: 'shop', displayName: 'Shop' },
      { slug: 'wiki', displayName: 'Wiki' },
    ])
    await c.syncComponents(tx, 'ci', [
      { slug: 'shop-api', displayName: 'API', appSlug: 'shop' },
      { slug: 'wiki-ui', displayName: 'UI', appSlug: 'wiki' },
    ])
    await c.syncTargets(tx, 'ci', [
      { slug: 't-prod', displayName: 'prod', environmentSlug: 'prod' },
      { slug: 't-qa', displayName: 'qa', environmentSlug: 'qa' },
    ])
    await c.syncArtifacts(tx, 'ci', [
      { componentSlug: 'shop-api', version: 'v1' },
      { componentSlug: 'shop-api', version: 'v2' },
      { componentSlug: 'wiki-ui', version: 'w1' },
      { componentSlug: 'wiki-ui', version: 'w2' },
    ])
  })
}

const deploy = (
  c: Catalog,
  scope: string,
  list: Array<CatalogDeploymentInput>,
) => c.transaction((tx) => c.syncDeployments(tx, scope, list))

let abort: AbortController
beforeEach(async () => {
  abort = new AbortController()
  if (prisma) await resetCatalog(prisma)
})
afterEach(() => abort.abort())

/** A subscription's events, read one at a time. */
async function watch(input: {
  appSlugs?: Array<string>
  envSlugs?: Array<string>
  lastEventId?: string
}) {
  const caller = createTrpcRouter().createCaller(
    createEhTrpcContext({
      companySpecificBackend: backend,
      adminGroups: [],
      catalog: catalog!,
    }),
    { signal: abort.signal },
  )
  const events = (await caller.pairsWatch(input))[Symbol.asyncIterator]()
  return async () => {
    const r = await events.next()
    if (r.done) throw new Error('subscription ended')
    // A tracked event: [id, data, symbol].
    const [id, chunks] = r.value as unknown as [string, Array<PairChunk>]
    return { id, chunks }
  }
}

/** A pushed pair's version per component, so assertions read like the UI. */
const versions = (chunks: Array<PairChunk>) =>
  chunks.flatMap((c) =>
    c.facet === 'deployment' && 'data' in c
      ? [
          {
            pair: `${c.app}/${c.env}`,
            rows: c.data.rows.map((r) => `${r.componentSlug}@${r.version}`),
          },
        ]
      : [],
  )

describe.skipIf(!prisma)('pairsWatch', () => {
  it('starts with an empty event carrying the current id, so a reconnect can say what it saw', async () => {
    await givenTwoApps(catalog!)
    const next = await watch({ appSlugs: ['shop'] })

    expect(await next()).toEqual({ id: catalog!.lastChangeId(), chunks: [] })
  })

  it('pushes a committed deployment of a pair in scope, and nothing out of scope', async () => {
    await givenTwoApps(catalog!)
    const next = await watch({ appSlugs: ['shop'] })
    await next()

    await deploy(catalog!, 'wiki', [deployment('wiki-ui', 't-qa', 'w1')])
    await deploy(catalog!, 'shop', [deployment('shop-api', 't-prod', 'v1')])

    const pushed = await next()
    expect(pushed.id).toBe(catalog!.lastChangeId())
    expect(versions(pushed.chunks)).toEqual([
      { pair: 'shop/prod', rows: ['shop-api@v1'] },
    ])
    expect(pushed.chunks[0]).toMatchObject({ app: 'shop', facet: 'components' })
  })

  it('a horizontal slice hears every App on its Environment, and a removal arrives as no rows', async () => {
    await givenTwoApps(catalog!)
    await deploy(catalog!, 'ci', [deployment('wiki-ui', 't-qa', 'w1')])
    const next = await watch({ envSlugs: ['qa'] })
    await next()

    await deploy(catalog!, 'ci', [])

    expect(versions((await next()).chunks)).toEqual([
      { pair: 'wiki/qa', rows: [] },
    ])
  })

  it('a Health checked again with the same result pushes nothing', async () => {
    await givenTwoApps(catalog!)
    await deploy(catalog!, 'ci', [deployment('shop-api', 't-prod', 'v1')])
    const health = (observedAt: Date, state: 'healthy' | 'down') =>
      catalog!.transaction((tx) =>
        catalog!.syncHealth(tx, 'h', [
          {
            componentSlug: 'shop-api',
            targetSlug: 't-prod',
            state,
            checker: 'http',
            observedAt,
          },
        ]),
      )
    await health(new Date('2026-01-01'), 'healthy')
    const next = await watch({ appSlugs: ['shop'] })
    await next()

    await health(new Date('2026-01-02'), 'healthy')
    await health(new Date('2026-01-03'), 'down')

    const pushed = await next()
    // The first push is the change to down, not the check again.
    expect(pushed.id).toBe(catalog!.lastChangeId())
    expect(pushed.chunks).toContainEqual(
      expect.objectContaining({
        facet: 'deployment',
        data: {
          rows: [
            expect.objectContaining({
              health: expect.objectContaining({ state: 'down' }),
            }),
          ],
        },
      }),
    )
  })

  it('a client back with an id it saw before resends its whole scope first', async () => {
    await givenTwoApps(catalog!)
    const seen = catalog!.lastChangeId()
    await deploy(catalog!, 'ci', [
      deployment('shop-api', 't-prod', 'v2'),
      deployment('shop-api', 't-qa', 'v1'),
    ])

    const next = await watch({ appSlugs: ['shop'], lastEventId: seen })

    const first = await next()
    expect(first.id).toBe(catalog!.lastChangeId())
    expect(versions(first.chunks)).toEqual(
      expect.arrayContaining([
        { pair: 'shop/prod', rows: ['shop-api@v2'] },
        { pair: 'shop/qa', rows: ['shop-api@v1'] },
      ]),
    )
  })

  it('a client back with the current id gets nothing again', async () => {
    await givenTwoApps(catalog!)
    const next = await watch({
      appSlugs: ['shop'],
      lastEventId: catalog!.lastChangeId(),
    })

    expect((await next()).chunks).toEqual([])
  })
})
