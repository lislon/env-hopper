// @vitest-environment node
/**
 * `pair` and `slices` served by the real router over real HTTP, read back
 * through `httpBatchStreamLink` as the browser reads them.
 */
import {
  TRPCClientError,
  createTRPCClient,
  httpBatchStreamLink,
} from '@trpc/client'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext } from '../../server/ehTrpcContext'
import {
  getTestCatalogClient,
  resetCatalog,
  withOwnTransactions,
} from '../../testing'
import type { AddressInfo } from 'node:net'
import type { Catalog, PairDeployments } from '../../catalog'
import type { PairChunk } from '../../server/pairDetails'
import type { TRPCRouter } from '../../server/controller'
import type {
  BootstrapConfigData,
  EhBackendCompanySpecificBackend,
  ResourceJumpsData,
} from '../../types'

const jumps: ResourceJumpsData = {
  resourceJumps: [
    {
      slug: 'shop',
      displayName: 'Shop',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/shop',
        overrides: { prod: 'https://shop.example.com', qa: 'https://qa' },
      },
    },
    {
      slug: 'shop@order',
      displayName: 'Order',
      urlTemplate: { default: 'https://{{subdomain}}/o/{{orderId}}' },
      lateResolvableParamSlugs: ['orderId'],
    },
    {
      slug: 'wiki',
      displayName: 'Wiki',
      urlTemplate: { default: 'https://w' },
    },
  ],
  envs: [
    { slug: 'prod', displayName: 'Prod', templateParams: { subdomain: 'p' } },
    { slug: 'qa', displayName: 'QA', templateParams: { subdomain: 'q' } },
  ],
  lateResolvableParams: [
    { slug: 'orderId', displayName: 'Order ID' },
    { slug: 'unused', displayName: 'Unused' },
  ],
}
const login = { slug: 'admin', username: 'admin', password: 'staging-pass' }
const bootstrap = {
  envs: {
    prod: {
      slug: 'prod',
      displayName: 'Prod',
      appOverride: { unavailable: ['credentials'] },
    },
    qa: { slug: 'qa', displayName: 'QA' },
  },
  apps: {
    shop: {
      slug: 'shop',
      displayName: 'Shop',
      ui: { pages: [], credentials: [login] },
    },
    wiki: { slug: 'wiki', displayName: 'Wiki' },
  },
} as unknown as BootstrapConfigData

const backend = {
  getResourceJumps: () => Promise.resolve(jumps),
  getBootstrapData: () => Promise.resolve(bootstrap),
} as EhBackendCompanySpecificBackend

const shopOnProd: PairDeployments = {
  components: { shop: [{ slug: 'shop-api', displayName: 'API', lead: true }] },
  pairs: [
    {
      app: 'shop',
      env: 'prod',
      users: {},
      rows: [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop',
          version: 'main-7',
          aliases: [],
          source: 'ci',
        },
      ],
    },
  ],
}

/** A catalog answering from memory, `delayMs` late, the way a slow DB would. */
function memoryCatalog(found: PairDeployments, delayMs = 0): Catalog {
  return {
    async getPairDeployments({ appSlugs, envSlugs }) {
      await new Promise((r) => setTimeout(r, delayMs))
      return {
        components: Object.fromEntries(
          Object.entries(found.components).filter(
            ([a]) => !appSlugs || appSlugs.includes(a),
          ),
        ),
        pairs: found.pairs.filter(
          (p) =>
            (!appSlugs || appSlugs.includes(p.app)) &&
            (!envSlugs || envSlugs.includes(p.env)),
        ),
      }
    },
  } as Catalog
}

let catalog: Catalog | null = null
const server = createHTTPServer({
  router: createTrpcRouter(),
  createContext: () =>
    createEhTrpcContext({
      companySpecificBackend: backend,
      adminGroups: [],
      catalog,
    }),
})
let client: ReturnType<typeof createTRPCClient<TRPCRouter>>
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, r))
  const { port } = server.address() as AddressInfo
  client = createTRPCClient<TRPCRouter>({
    links: [httpBatchStreamLink({ url: `http://127.0.0.1:${port}` })],
  })
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))
beforeEach(() => {
  catalog = memoryCatalog(shopOnProd)
})

type Facet = Pick<PairChunk, 'app' | 'env' | 'facet'>

/** Times each chunk from the moment the request is sent. */
async function collect<T extends Facet>(request: Promise<AsyncIterable<T>>) {
  const start = Date.now()
  const chunks: Array<T & { ms: number }> = []
  for await (const c of await request)
    chunks.push({ ...c, ms: Date.now() - start })
  return chunks
}
const facetsOf = (chunks: Array<Facet>) =>
  chunks.map((c) => `${c.app}/${c.env}/${c.facet}`).sort()

describe('pair', () => {
  it('streams each facet as its source answers: config first, a slow catalog last', async () => {
    const SLOW_MS = 400
    catalog = memoryCatalog(shopOnProd, SLOW_MS)
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(chunks.map((c) => c.facet)).toEqual([
      'jumps',
      'credentials',
      'deployment',
    ])
    const first = chunks[0]!.ms
    const last = chunks.at(-1)!.ms
    console.log(
      `[pair] first chunk ${first} ms, last chunk ${last} ms (slow facet ${SLOW_MS} ms)`,
    )
    expect(first).toBeLessThan(SLOW_MS / 2)
    expect(last - first).toBeGreaterThanOrEqual(SLOW_MS - 50)
  })

  it("carries the pair's jumps narrowed to its Environment, its credentials and its Deployment", async () => {
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'qa' }),
    )
    const of = (f: string) => chunks.find((c) => c.facet === f)!.data
    expect(of('jumps')).toEqual({
      resourceJumps: [
        {
          slug: 'shop',
          displayName: 'Shop',
          urlTemplate: {
            default: 'https://{{subdomain}}.example.com/shop',
            overrides: { qa: 'https://qa' },
          },
        },
        jumps.resourceJumps[1],
      ],
      envs: [jumps.envs[1]],
      lateResolvableParams: [{ slug: 'orderId', displayName: 'Order ID' }],
    })
    expect(of('credentials')).toEqual({ ui: [login], dataSources: [] })
    // Not deployed here: the Components, no rows.
    expect(of('deployment')).toEqual({
      components: shopOnProd.components.shop,
      users: {},
      rows: [],
    })
  })

  it('an Environment that lacks credentials gets none; no catalog, no Deployments', async () => {
    catalog = null
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(chunks.find((c) => c.facet === 'credentials')!.data).toEqual({
      ui: [],
      dataSources: [],
    })
    expect(chunks.find((c) => c.facet === 'deployment')!.data).toEqual({
      components: [],
      users: {},
      rows: [],
    })
  })
})

describe('slices', () => {
  it("is the union of each Environment's Apps and each App's Environments", async () => {
    const chunks = await collect(
      client.slices.query({ appSlugs: ['wiki'], envSlugs: ['prod'] }),
    )
    expect(facetsOf(chunks)).toEqual(
      facetsOf(
        ['shop/prod', 'wiki/prod', 'wiki/qa'].flatMap((p) => {
          const [app, env] = p.split('/') as [string, string]
          return (['jumps', 'credentials', 'deployment'] as const).map(
            (facet) => ({ app, env, facet }),
          )
        }),
      ),
    )
    const shopProd = chunks.find(
      (c) => c.app === 'shop' && c.env === 'prod' && c.facet === 'deployment',
    )!
    expect(shopProd.data).toEqual({
      components: shopOnProd.components.shop,
      users: {},
      rows: shopOnProd.pairs[0]!.rows,
    })
  })

  it('takes an App the config does not know through its Deployments', async () => {
    catalog = memoryCatalog({
      components: { api: [{ slug: 'api', displayName: 'API', lead: true }] },
      pairs: [{ ...shopOnProd.pairs[0]!, app: 'api', env: 'qa' }],
    })
    const chunks = await collect(client.slices.query({ appSlugs: ['api'] }))
    expect(facetsOf(chunks)).toEqual(['api/qa/deployment'])
  })

  it('rejects more than 50 Apps or 50 Environments, and takes 50', async () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => `s${i}`)
    for (const input of [{ appSlugs: many(51) }, { envSlugs: many(51) }]) {
      const err = await client.slices.query(input).then(
        () => null,
        (e: unknown) => e,
      )
      expect(err).toBeInstanceOf(TRPCClientError)
      expect((err as TRPCClientError<TRPCRouter>).data?.code).toBe(
        'BAD_REQUEST',
      )
    }
    // Unknown slugs: accepted, and nothing to send.
    const ok = await collect(
      client.slices.query({ appSlugs: many(50), envSlugs: many(50) }),
    )
    expect(ok).toEqual([])
  })
})

const prisma = getTestCatalogClient()
describe.skipIf(!prisma)('pair over the real catalog', () => {
  beforeEach(async () => {
    await resetCatalog(prisma!)
  })

  it('serves the Deployment the catalog holds for the pair', async () => {
    const w = withOwnTransactions(createCatalog(prisma!))
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
    catalog = createCatalog(prisma!)
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    const d = chunks.find((c) => c.facet === 'deployment')!
    expect(d.data).toEqual({
      components: [{ slug: 'shop-api', displayName: 'Shop API', lead: true }],
      users: {},
      rows: [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop',
          version: 'main-7',
          aliases: [],
          source: 'ci',
        },
      ],
    })
  })
})
