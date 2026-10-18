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

const PIPELINES = 'https://ci.example.com/shop/-/pipelines/'
const shopOnProd: PairDeployments = {
  components: { shop: [{ slug: 'shop-api', displayName: 'API', lead: true }] },
  pairs: [
    {
      app: 'shop',
      env: 'prod',
      users: { ann: { firstName: 'Ann' } },
      rows: [
        {
          componentSlug: 'shop-api',
          targetSlug: 'k8s:prod/shop',
          version: 'main-7',
          aliases: [],
          buildUrl: `${PIPELINES}101`,
          deployUrl: `${PIPELINES}102`,
          deployedBy: 'ann',
          source: 'ci',
        },
      ],
    },
  ],
}

/** A catalog answering from memory, `delayMs` late, the way a slow DB would. */
function memoryCatalog(
  found: PairDeployments,
  delayMs = 0,
  fails = false,
): Catalog {
  return {
    async getPairDeployments({ appSlugs, envSlugs }) {
      await new Promise((r) => setTimeout(r, delayMs))
      if (fails) throw new Error('catalog down')
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

type Chunk = PairChunk & { ms: number }

/** Times each chunk from the moment the request is sent. */
async function collect(request: Promise<AsyncIterable<object>>) {
  const start = Date.now()
  const chunks: Array<Chunk> = []
  for await (const c of await request)
    chunks.push({ ...(c as PairChunk), ms: Date.now() - start })
  return chunks
}
/** `app/env/facet`, a part left out where the chunk has none. */
const nameOf = (c: PairChunk) =>
  [
    'app' in c ? c.app : '',
    'env' in c ? c.env : '',
    c.facet + ('error' in c ? '!' : ''),
  ].join('/')
const namesOf = (chunks: Array<PairChunk>) => chunks.map(nameOf)
const dataOf = (chunks: Array<PairChunk>, name: string) =>
  (chunks.find((c) => nameOf(c) === name) as { data: unknown } | undefined)
    ?.data

describe('pair', () => {
  it('streams each facet as its source answers: config first, a slow catalog last', async () => {
    const SLOW_MS = 400
    catalog = memoryCatalog(shopOnProd, SLOW_MS)
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(namesOf(chunks.slice(0, 2)).sort()).toEqual([
      '/prod/credentials',
      'shop/prod/jumps',
    ])
    expect(namesOf(chunks.slice(2))).toEqual([
      '//users',
      'shop//components',
      'shop/prod/deployment',
    ])
    const first = chunks[0]!.ms
    const last = chunks.at(-1)!.ms
    console.log(
      `[pair] first chunk ${first} ms, last chunk ${last} ms (slow facet ${SLOW_MS} ms)`,
    )
    expect(first).toBeLessThan(SLOW_MS / 2)
    expect(last - first).toBeGreaterThanOrEqual(SLOW_MS - 50)
  })

  it("carries the pair's jumps narrowed to its Environment, its Environment's credentials and its Deployment", async () => {
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'qa' }),
    )
    expect(dataOf(chunks, 'shop/qa/jumps')).toEqual({
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
    expect(dataOf(chunks, '/qa/credentials')).toEqual({
      shop: { ui: [login], dataSources: [] },
    })
    // Not deployed here: the Components, no rows.
    expect(dataOf(chunks, 'shop//components')).toEqual(
      shopOnProd.components.shop,
    )
    expect(dataOf(chunks, 'shop/qa/deployment')).toEqual({ rows: [] })
  })

  it('an Environment that lacks credentials gets none; no catalog, no Deployments', async () => {
    catalog = null
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(dataOf(chunks, '/prod/credentials')).toEqual({})
    expect(dataOf(chunks, 'shop/prod/deployment')).toEqual({ rows: [] })
  })

  it('a failing source fails only its facets', async () => {
    catalog = memoryCatalog(shopOnProd, 0, true)
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(namesOf(chunks).sort()).toEqual([
      '//deployment!',
      '/prod/credentials',
      'shop/prod/jumps',
    ])
  })
})

describe('slices', () => {
  it("is each Environment's Apps and each App's deployed Environments, without jumps", async () => {
    const chunks = await collect(
      client.slices.query({ appSlugs: ['shop'], envSlugs: ['qa'] }),
    )
    // qa: every App with a jump; shop: prod, where it is deployed, not every
    // Environment.
    expect(namesOf(chunks).sort()).toEqual(
      [
        '/prod/credentials',
        '/qa/credentials',
        'shop//components',
        'shop/prod/deployment',
        'shop/qa/deployment',
        'wiki/qa/deployment',
      ].sort(),
    )
    expect(dataOf(chunks, '/qa/credentials')).toEqual({
      shop: { ui: [login], dataSources: [] },
    })
    expect(dataOf(chunks, '/prod/credentials')).toEqual({})
  })

  it('sends Components once per App, Users by username only, and pipeline links as ids', async () => {
    const onQa = {
      ...shopOnProd.pairs[0]!,
      env: 'qa',
      rows: [
        {
          ...shopOnProd.pairs[0]!.rows[0]!,
          targetSlug: 'k8s:qa/shop',
          buildUrl: `${PIPELINES}201`,
          deployUrl: 'https://elsewhere.example.com/deploy',
        },
      ],
    }
    catalog = memoryCatalog({
      ...shopOnProd,
      pairs: [...shopOnProd.pairs, onQa],
    })
    const chunks = await collect(client.slices.query({ appSlugs: ['shop'] }))
    expect(namesOf(chunks).filter((n) => !n.includes('credentials'))).toEqual([
      'shop//components',
      'shop/prod/deployment',
      'shop/qa/deployment',
    ])
    // No profiles in a slice; the rows keep the username.
    expect(dataOf(chunks, '//users')).toBeUndefined()
    expect(dataOf(chunks, 'shop//components')).toEqual([
      {
        slug: 'shop-api',
        displayName: 'API',
        lead: true,
        pipelineUrl: `${PIPELINES}{{id}}`,
      },
    ])
    const {
      buildUrl: _b,
      deployUrl: _d,
      ...row
    } = shopOnProd.pairs[0]!.rows[0]!
    expect(dataOf(chunks, 'shop/prod/deployment')).toEqual({
      rows: [{ ...row, buildPipelineId: '101', deployPipelineId: '102' }],
    })
    expect(dataOf(chunks, 'shop/qa/deployment')).toEqual({
      rows: [
        {
          ...row,
          targetSlug: 'k8s:qa/shop',
          buildPipelineId: '201',
          deployUrl: 'https://elsewhere.example.com/deploy',
        },
      ],
    })
  })

  it('sends the Health run time once and a detail only off healthy', async () => {
    const at = '2026-10-18T10:00:00.000Z'
    const later = '2026-10-18T10:05:00.000Z'
    const base = shopOnProd.pairs[0]!.rows[0]!
    const health = (state: 'healthy' | 'down', observedAt: string) => ({
      state,
      checker: 'http',
      observedAt,
      detail: state === 'healthy' ? '200 OK' : '503',
    })
    catalog = memoryCatalog({
      ...shopOnProd,
      pairs: [
        {
          ...shopOnProd.pairs[0]!,
          rows: [{ ...base, health: health('healthy', at) }],
        },
        {
          ...shopOnProd.pairs[0]!,
          env: 'qa',
          rows: [
            { ...base, targetSlug: 'k8s:qa/a', health: health('down', at) },
            {
              ...base,
              targetSlug: 'k8s:qa/b',
              health: health('healthy', later),
            },
          ],
        },
      ],
    })
    const chunks = await collect(client.slices.query({ appSlugs: ['shop'] }))
    expect(namesOf(chunks).filter((n) => n.startsWith('//meta'))).toHaveLength(
      1,
    )
    expect(dataOf(chunks, '//meta')).toEqual({ observedAt: at })
    const healthOf = (name: string) =>
      (dataOf(chunks, name) as { rows: Array<{ health?: unknown }> }).rows.map(
        (r) => r.health,
      )
    expect(healthOf('shop/prod/deployment')).toEqual([
      { state: 'healthy', checker: 'http' },
    ])
    expect(healthOf('shop/qa/deployment')).toEqual([
      { state: 'down', checker: 'http', detail: '503' },
      { state: 'healthy', checker: 'http', observedAt: later },
    ])
  })

  it('leaves out the pair it is told to, which `pair` loads', async () => {
    const chunks = await collect(
      client.slices.query({
        appSlugs: ['shop'],
        envSlugs: ['qa'],
        exceptPair: { appSlug: 'shop', envSlug: 'prod' },
      }),
    )
    const names = namesOf(chunks)
    expect(names).not.toContain('shop/prod/deployment')
    expect(names).toContain('shop/qa/deployment')
    // No pair left on prod: no credentials for it either.
    expect(names).not.toContain('/prod/credentials')
  })

  it('takes an App the config does not know through its Deployments', async () => {
    catalog = memoryCatalog({
      components: { api: [{ slug: 'api', displayName: 'API', lead: true }] },
      pairs: [{ ...shopOnProd.pairs[0]!, app: 'api', env: 'qa' }],
    })
    const chunks = await collect(client.slices.query({ appSlugs: ['api'] }))
    expect(namesOf(chunks).sort()).toEqual([
      '/qa/credentials',
      'api//components',
      'api/qa/deployment',
    ])
  })

  it('a failing catalog still sends the credentials the config knows', async () => {
    catalog = memoryCatalog(shopOnProd, 0, true)
    const chunks = await collect(
      client.slices.query({ appSlugs: ['shop'], envSlugs: ['qa'] }),
    )
    expect(namesOf(chunks).sort()).toEqual(['//deployment!', '/qa/credentials'])
  })

  it('`users` answers the profiles asked for, at most 100 names', async () => {
    catalog = {
      getUsers: (names: Array<string>) =>
        Promise.resolve(
          Object.fromEntries(
            names
              .filter((n) => n === 'ann')
              .map((n) => [n, { firstName: 'Ann' }]),
          ),
        ),
    } as unknown as Catalog
    expect(await client.users.query({ usernames: ['ann', 'nobody'] })).toEqual({
      ann: { firstName: 'Ann' },
    })
    const tooMany = Array.from({ length: 101 }, (_, i) => `u${i}`)
    await expect(client.users.query({ usernames: tooMany })).rejects.toThrow()
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
    // Nothing checks it: no Health row, so no Health on the pair.
    await w.syncUsers('ci', [
      { username: 'ann', email: 'ann@example.com', firstName: 'Ann' },
    ])
    catalog = createCatalog(prisma!)
    // The profile, never the contact details.
    expect(await catalog.getUsers(['ann', 'nobody'])).toEqual({
      ann: { firstName: 'Ann' },
    })
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(dataOf(chunks, 'shop//components')).toEqual([
      { slug: 'shop-api', displayName: 'Shop API', lead: true },
    ])
    expect(dataOf(chunks, 'shop/prod/deployment')).toEqual({
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
