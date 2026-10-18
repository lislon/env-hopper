// @vitest-environment node
/**
 * Compressed responses still stream: each chunk of an async-generator query
 * reaches the client when it is yielded, under gzip and brotli alike.
 */
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import express from 'express'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { ehCompression } from '../../middleware/compression'

const t = initTRPC.create()
const SLOW_MS = 400
const router = t.router({
  facets: t.procedure.query(async function* () {
    yield { facet: 'fast' }
    await new Promise((r) => setTimeout(r, SLOW_MS))
    yield { facet: 'slow' }
  }),
  big: t.procedure.query(() => 'x'.repeat(50_000)),
})

let server: Server
let url = ''
beforeAll(async () => {
  const app = express()
  app.use(ehCompression())
  app.use('/trpc', trpcExpress.createExpressMiddleware({ router }))
  await new Promise<void>((r) => {
    server = app.listen(0, () => r())
  })
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/trpc`
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

describe.each(['gzip', 'br'])('under %s', (encoding) => {
  it('sends each streamed chunk when it is yielded', async () => {
    const seen: Array<string | null> = []
    const client = createTRPCClient<typeof router>({
      links: [
        httpBatchStreamLink({
          url,
          fetch: async (input, init) => {
            const res = await fetch(input, {
              ...init,
              headers: { ...init?.headers, 'accept-encoding': encoding },
            } as RequestInit)
            seen.push(res.headers.get('content-encoding'))
            return res
          },
        }),
      ],
    })
    const start = Date.now()
    const at: Array<number> = []
    for await (const chunk of await client.facets.query()) {
      at.push(Date.now() - start)
      expect(chunk.facet).toBe(at.length === 1 ? 'fast' : 'slow')
    }
    console.log(
      `[compression ${encoding}] first chunk ${at[0]} ms, last ${at[1]} ms (slow facet ${SLOW_MS} ms)`,
    )
    expect(seen).toEqual([encoding])
    expect(at[0]).toBeLessThan(SLOW_MS / 2)
    expect(at[1]! - at[0]!).toBeGreaterThanOrEqual(SLOW_MS - 50)
  })

  it('compresses a plain response', async () => {
    const res = await fetch(`${url}/big`, {
      headers: { 'accept-encoding': encoding },
    })
    expect(res.headers.get('content-encoding')).toBe(encoding)
    expect((await res.json()).result.data).toHaveLength(50_000)
  })
})
