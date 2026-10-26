// @vitest-environment node
/** `usage.record` over real HTTP, as the browser sends it, into the real catalog. */
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext, ehUserIdOf } from '../../server/ehTrpcContext'
import { getTestCatalogClient, resetCatalog } from '../../testing'
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
  createContext: ({ req, res }) =>
    createEhTrpcContext({
      companySpecificBackend: backend,
      adminGroups: [],
      catalog: prisma ? createCatalog(prisma) : null,
      ehUserId: ehUserIdOf(req, res),
    }),
})
let url = ''
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, r))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

const record = (input: object, cookie?: string) =>
  fetch(`${url}/usage.record`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie && { cookie }),
    },
    body: JSON.stringify(input),
  })

describe.skipIf(!prisma)('usage.record', () => {
  beforeEach(async () => {
    await resetCatalog(prisma!)
    warmed.length = 0
  })

  it('names a new visitor by an httpOnly cookie, keeps each thing they do under it, and tells the Entity Provider what to warm', async () => {
    const first = await record({ kind: 'open', appSlug: 'shop', envSlug: 'qa' })
    const cookie = first.headers.get('set-cookie') ?? ''
    const id = /eh_uid=([^;]+)/.exec(cookie)?.[1]
    const second = await record(
      {
        kind: 'jump',
        appSlug: 'shop',
        envSlug: 'qa',
        resourceJump: 'shop@order',
        url: 'https://qa/o/1',
      },
      `eh_uid=${id}`,
    )

    const events = await createCatalog(prisma!).getUserEvents(
      new Date(Date.now() - 60_000),
    )
    expect({
      statuses: [first.status, second.status],
      cookie: cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax'),
      secondSetsCookie: second.headers.get('set-cookie'),
      events: events.map(({ at, ...e }) => ({
        ...e,
        recent: Date.now() - at.getTime() < 60_000,
      })),
      warmed,
    }).toEqual({
      statuses: [200, 200],
      cookie: true,
      secondSetsCookie: null,
      events: [
        {
          userId: id,
          kind: 'open',
          appSlug: 'shop',
          envSlug: 'qa',
          recent: true,
        },
        {
          userId: id,
          kind: 'jump',
          appSlug: 'shop',
          envSlug: 'qa',
          resourceJump: 'shop@order',
          url: 'https://qa/o/1',
          recent: true,
        },
      ],
      warmed: [
        { appEnvs: [{ appSlug: 'shop', envSlug: 'qa' }], reason: 'open' },
        { appEnvs: [{ appSlug: 'shop', envSlug: 'qa' }], reason: 'jump' },
      ],
    })
  })
})
