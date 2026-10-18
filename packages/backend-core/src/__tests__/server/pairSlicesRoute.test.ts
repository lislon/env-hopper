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
import type { AppComponent, Catalog, PairDeployments } from '../../catalog'
import type { PairChunk } from '../../server/pairDetails'
import type { TRPCRouter } from '../../server/controller'
import type {
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
let bootstrapAsked = 0
const backend = {
  getResourceJumps: () => Promise.resolve(jumps),
  // Credentials and everything else in it reach the client by `bootstrap`.
  getBootstrapData: () => {
    bootstrapAsked++
    return Promise.reject(new Error('pair details never read bootstrap'))
  },
} as EhBackendCompanySpecificBackend

const PIPELINES = 'https://ci.example.com/shop/-/pipelines/'
/** What the catalog holds: each App's Components, and the pairs' Deployments. */
type Found = PairDeployments & {
  components: Record<string, Array<AppComponent>>
}
const shopOnProd: Found = {
  components: {
    shop: [
      {
        slug: 'shop-api',
        displayName: 'API',
        lead: true,
        pipelineUrl: `${PIPELINES}{{id}}`,
      },
    ],
  },
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

type Filter = { appSlugs?: Array<string>; envSlugs?: Array<string> }
/** A catalog answering from memory, `delayMs` late, the way a slow DB would. */
function memoryCatalog(
  found: Found,
  delayMs: number | ((filter: Filter) => number) = 0,
  fails = false,
): Catalog {
  return {
    async getComponents({ appSlugs }) {
      if (fails) throw new Error('catalog down')
      return Object.fromEntries(
        Object.entries(found.components).filter(
          ([a]) => !appSlugs || appSlugs.includes(a),
        ),
      )
    },
    async getPairDeployments({ appSlugs, envSlugs }) {
      const ms =
        typeof delayMs === 'number' ? delayMs : delayMs({ appSlugs, envSlugs })
      await new Promise((r) => setTimeout(r, ms))
      if (fails) throw new Error('catalog down')
      return {
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
    expect(namesOf(chunks)).toEqual([
      'shop/prod/jumps',
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

  it("carries the pair's jumps narrowed to its Environment and its Deployment", async () => {
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
    // Not deployed here: the Components, no rows.
    expect(dataOf(chunks, 'shop//components')).toEqual(
      shopOnProd.components.shop,
    )
    expect(dataOf(chunks, 'shop/qa/deployment')).toEqual({ rows: [] })
  })

  it('no catalog, no Deployments', async () => {
    catalog = null
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(namesOf(chunks).sort()).toEqual([
      'shop/prod/deployment',
      'shop/prod/jumps',
    ])
    expect(dataOf(chunks, 'shop/prod/deployment')).toEqual({ rows: [] })
  })

  it('never asks for the bootstrap data, which carries the credentials', async () => {
    bootstrapAsked = 0
    await collect(client.pair.query({ appSlug: 'shop', envSlug: 'prod' }))
    await collect(
      client.slices.query({ appSlugs: ['shop'], envSlugs: ['prod'] }),
    )
    expect(bootstrapAsked).toBe(0)
  })

  it('a failing source fails only its facets', async () => {
    catalog = memoryCatalog(shopOnProd, 0, true)
    const chunks = await collect(
      client.pair.query({ appSlug: 'shop', envSlug: 'prod' }),
    )
    expect(namesOf(chunks).sort()).toEqual([
      'shop/prod/deployment!',
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
        'shop//components',
        'shop/prod/deployment',
        'shop/qa/deployment',
        'wiki/qa/deployment',
      ].sort(),
    )
  })

  it("sends each slice's pairs as soon as that slice is read, not after the slowest", async () => {
    const SLOW_MS = 400
    // qa's read answers at once, shop's vertical read late.
    catalog = memoryCatalog(shopOnProd, (f) => (f.appSlugs ? SLOW_MS : 0))
    const chunks = await collect(
      client.slices.query({ appSlugs: ['shop'], envSlugs: ['qa'] }),
    )
    const at = (name: string) => chunks.find((c) => nameOf(c) === name)!.ms
    console.log(
      `[slices] qa pairs at ${at('wiki/qa/deployment')} ms, shop/prod at ${at('shop/prod/deployment')} ms (slow read ${SLOW_MS} ms)`,
    )
    expect(at('wiki/qa/deployment')).toBeLessThan(SLOW_MS / 2)
    expect(at('shop/qa/deployment')).toBeLessThan(SLOW_MS / 2)
    expect(at('shop/prod/deployment')).toBeGreaterThanOrEqual(SLOW_MS - 50)
    // A pair in both slices goes out once.
    expect(
      namesOf(chunks).filter((n) => n === 'shop/qa/deployment'),
    ).toHaveLength(1)
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
    expect(namesOf(chunks)).toEqual([
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

  it('sends the same chunks whichever slice is read first, each pair once and every reference resolved', async () => {
    const ui = { slug: 'shop-ui', displayName: 'UI' }
    const base = shopOnProd.pairs[0]!.rows[0]!
    const { buildUrl: _b, deployUrl: _d, ...bare } = base
    const found: Found = {
      components: {
        shop: [
          ...shopOnProd.components.shop!,
          { ...ui, pipelineUrl: `${PIPELINES}{{id}}` },
        ],
        api: [
          {
            slug: 'api',
            displayName: 'API',
            lead: true,
            pipelineUrl: 'https://ci.example.com/api/-/pipelines/{{id}}',
          },
        ],
      },
      pairs: [
        // qa: only shop's API; prod: its UI too, the only UI link.
        { ...shopOnProd.pairs[0]!, env: 'qa', rows: [base] },
        {
          ...shopOnProd.pairs[0]!,
          rows: [
            base,
            { ...bare, componentSlug: 'shop-ui', buildUrl: `${PIPELINES}301` },
          ],
        },
        {
          app: 'api',
          env: 'qa',
          users: {},
          rows: [
            {
              ...bare,
              componentSlug: 'api',
              buildUrl: 'https://ci.example.com/api/-/pipelines/7',
              deployedBy: 'bob',
            },
          ],
        },
      ],
    }
    const input = { appSlugs: ['shop', 'api'], envSlugs: ['qa', 'prod'] }
    const orders: Array<(f: Filter) => number> = [
      (f) => (f.appSlugs ? 0 : 40),
      (f) => (f.appSlugs ? 40 : 0),
      (f) => (f.envSlugs?.[0] === 'prod' || f.appSlugs?.[0] === 'api' ? 0 : 40),
    ]
    const runs: Array<Array<PairChunk>> = []
    for (const delay of orders) {
      catalog = memoryCatalog(found, delay)
      runs.push(
        (await collect(client.slices.query(input))).map(
          ({ ms: _, ...c }) => c as PairChunk,
        ),
      )
    }
    // The arrival order differs; the chunks do not.
    expect(new Set(runs.map((r) => namesOf(r).join())).size).toBeGreaterThan(1)
    const sorted = (r: Array<PairChunk>) =>
      r.map((c) => JSON.stringify(c)).sort()
    for (const run of runs) expect(sorted(run)).toEqual(sorted(runs[0]!))

    for (const run of runs) {
      const names = namesOf(run)
      const deployments = names.filter((n) => n.endsWith('/deployment'))
      expect(new Set(deployments).size).toBe(deployments.length)
      // What breaks the spec: a second Components chunk for an App (its
      // pipelineUrl could change), a Deployment before its App's Components,
      // a row naming a Component the stream did not send.
      const broken: Array<string> = []
      const sentComponents = new Map<string, Array<AppComponent>>()
      for (const c of run) {
        if ('error' in c) broken.push(nameOf(c))
        else if (c.facet === 'components') {
          if (sentComponents.has(c.app))
            broken.push(`${c.app} components twice`)
          sentComponents.set(c.app, c.data)
        } else if (c.facet === 'deployment') {
          const known = sentComponents.get(c.app)
          if ((known !== undefined) !== c.app in found.components)
            broken.push(`${c.app}/${c.env} before its components`)
          for (const row of c.data.rows)
            if (!known?.some((k) => k.slug === row.componentSlug))
              broken.push(`${c.app}/${c.env} names ${row.componentSlug}`)
        }
      }
      expect(broken).toEqual([])
      // A slice names Users by username only; `users` answers them.
      expect(names).not.toContain('//users')
    }
  })

  it('sends a pair once, however many of its slices hold it', async () => {
    // shop on prod: by its jumps and its Deployment on prod, and in shop's
    // vertical slice, read after.
    catalog = memoryCatalog(shopOnProd, (f) => (f.appSlugs ? 50 : 0))
    const chunks = await collect(
      client.slices.query({ appSlugs: ['shop'], envSlugs: ['prod'] }),
    )
    expect(
      namesOf(chunks).filter((n) => n === 'shop/prod/deployment'),
    ).toHaveLength(1)
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
  })

  it('takes an App the config does not know through its Deployments', async () => {
    catalog = memoryCatalog({
      components: { api: [{ slug: 'api', displayName: 'API', lead: true }] },
      pairs: [{ ...shopOnProd.pairs[0]!, app: 'api', env: 'qa' }],
    })
    const chunks = await collect(client.slices.query({ appSlugs: ['api'] }))
    expect(namesOf(chunks).sort()).toEqual([
      'api//components',
      'api/qa/deployment',
    ])
  })

  it('a failing catalog fails each slice', async () => {
    catalog = memoryCatalog(shopOnProd, 0, true)
    const chunks = await collect(
      client.slices.query({ appSlugs: ['shop'], envSlugs: ['prod'] }),
    )
    expect(namesOf(chunks).sort()).toEqual([
      '/prod/deployment!',
      'shop//deployment!',
    ])
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
