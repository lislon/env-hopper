// @vitest-environment node
/** `usage.record` over real HTTP, as the browser sends it, into the real catalog. */
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext, ehUserOf } from '../../server/ehTrpcContext'
import { getTestCatalogClient, resetCatalog } from '../../testing'
import type { User } from 'better-auth/types'
import type { AddressInfo } from 'node:net'
import type { EhBackendCompanySpecificBackend } from '../../types'

const prisma = getTestCatalogClient()
const warmed: Array<unknown> = []
const backend = {
  warm: (appEnvs, reason) => {
    warmed.push({ appEnvs, reason })
  },
} as Partial<EhBackendCompanySpecificBackend> as EhBackendCompanySpecificBackend

const server = createHTTPServer({
  router: createTrpcRouter(),
  createContext: ({ req, res }) => {
    // Signed in as the account this header names, as a session would say.
    const account = req.headers['x-test-account']
    return createEhTrpcContext({
      companySpecificBackend: backend,
      adminGroups: [],
      catalog: prisma ? createCatalog(prisma) : null,
      ehUser: ehUserOf(req, res),
      user: typeof account === 'string' ? ({ id: account } as User) : undefined,
    })
  },
})
let url = ''
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, r))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

/** A browser: it keeps the cookie it is given, and may be signed in. */
function givenBrowser() {
  let cookie: string | undefined
  return {
    get cookie() {
      return cookie
    },
    async record(input: object, account?: string) {
      const res = await fetch(`${url}/usage.record`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(cookie && { cookie }),
          ...(account && { 'x-test-account': account }),
        },
        body: JSON.stringify(input),
      })
      const set = res.headers.get('set-cookie')
      if (set) cookie = set.split(';')[0]
      return { status: res.status, setCookie: set }
    },
  }
}

const open = (appSlug = 'shop', envSlug = 'qa') => ({
  kind: 'open',
  appSlug,
  envSlug,
})
const idOf = (b: { cookie?: string }) => b.cookie?.replace('eh_uid=', '')
const LEGACY = '2b8e0b42-5d0e-4f6c-9a3e-6a1f0c7d9e11'

describe.skipIf(!prisma)('usage.record', () => {
  beforeEach(async () => {
    await resetCatalog(prisma!)
    warmed.length = 0
  })

  it('names a new visitor by an httpOnly cookie, keeps each thing they do under it, and warms what a User jumps to', async () => {
    const browser = givenBrowser()
    const first = await browser.record(open())
    const second = await browser.record({
      kind: 'jump',
      appSlug: 'shop',
      envSlug: 'qa',
      resourceJump: 'shop@order',
      url: 'https://qa/o/1',
    })

    const events = await createCatalog(prisma!).getUserEvents(
      new Date(Date.now() - 60_000),
    )
    expect({
      statuses: [first.status, second.status],
      cookie:
        !!first.setCookie?.includes('HttpOnly') &&
        first.setCookie.includes('SameSite=Lax'),
      secondSetsCookie: second.setCookie,
      events: events.map(({ at, ...e }) => e),
      warmed,
    }).toEqual({
      statuses: [200, 200],
      cookie: true,
      secondSetsCookie: null,
      events: [
        { ehUserId: idOf(browser), ...open() },
        {
          ehUserId: idOf(browser),
          kind: 'jump',
          appSlug: 'shop',
          envSlug: 'qa',
          resourceJump: 'shop@order',
          url: 'https://qa/o/1',
        },
      ],
      // `open` comes with the `pair` it opened, which warms it.
      warmed: [
        { appEnvs: [{ appSlug: 'shop', envSlug: 'qa' }], reason: 'jump' },
      ],
    })
  })

  it('a browser the previous UI knew keeps its id: the first record adopts it, a later one cannot change it, and a malformed one is not adopted', async () => {
    const returning = givenBrowser()
    await returning.record({ ...open(), legacyUserId: LEGACY })
    await returning.record({
      ...open(),
      legacyUserId: 'c3d9a1e2-0000-4000-8000-000000000000',
    })
    const malformed = givenBrowser()
    await malformed.record({ ...open(), legacyUserId: "x'; DROP TABLE" })

    expect({
      returning: idOf(returning),
      eventsOfLegacy: (
        await createCatalog(prisma!).getUserEvents(new Date(0), {
          userId: LEGACY,
        })
      ).length,
      malformedIsUuid: /^[0-9a-f-]{36}$/.test(idOf(malformed) ?? ''),
    }).toEqual({
      returning: LEGACY,
      eventsOfLegacy: 2,
      malformedIsUuid: true,
    })
  })

  it('signing in links the browser to the account for good, and the account history spans every browser linked to it', async () => {
    const laptop = givenBrowser()
    const desktop = givenBrowser()
    const stranger = givenBrowser()
    await laptop.record(open('shop'))
    await laptop.record(open('wiki'), 'ann')
    // Another account signs in on the laptop later: it stays Ann's.
    await laptop.record(open('docs'), 'bob')
    await desktop.record(open('shop', 'prod'), 'ann')
    await stranger.record(open('shop'))

    const history = await createCatalog(prisma!).getUserEvents(new Date(0), {
      userId: 'ann',
    })
    const fromABrowserId = await createCatalog(prisma!).getUserEvents(
      new Date(0),
      { userId: idOf(desktop) },
    )

    const laptopEvent = (appSlug: string) => ({
      ehUserId: idOf(laptop),
      userId: 'ann',
      ...open(appSlug),
    })
    expect({
      history: history.map(({ at, ...e }) => e),
      sameFromABrowserId: fromABrowserId.length,
    }).toEqual({
      history: [
        laptopEvent('shop'),
        laptopEvent('wiki'),
        laptopEvent('docs'),
        { ehUserId: idOf(desktop), userId: 'ann', ...open('shop', 'prod') },
      ],
      sameFromABrowserId: 4,
    })
  })

  it('a pair asked for is warmed: someone looks at it', async () => {
    // As `httpBatchStreamLink` asks for it.
    const input = { 0: { appSlug: 'shop', envSlug: 'qa' } }
    const res = await fetch(
      `${url}/pair?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`,
      { headers: { 'trpc-accept': 'application/jsonl' } },
    )
    await res.text()

    expect(warmed).toEqual([
      { appEnvs: [{ appSlug: 'shop', envSlug: 'qa' }], reason: 'view' },
    ])
  })
})
