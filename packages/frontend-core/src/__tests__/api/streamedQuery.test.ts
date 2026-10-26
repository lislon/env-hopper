// @vitest-environment node
/**
 * An async-generator query streams through `httpBatchStreamLink` into
 * TanStack Query's `streamedQuery`, chunk by chunk, over real HTTP.
 */
import { QueryClient, experimental_streamedQuery } from '@tanstack/react-query'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { initTRPC } from '@trpc/server'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { afterAll, beforeAll, expect, test } from 'vitest'
import type { AddressInfo } from 'node:net'

const t = initTRPC.create()
const SLOW_MS = 400
const router = t.router({
  facets: t.procedure.query(async function* () {
    yield { facet: 'fast', at: Date.now() }
    await new Promise((r) => setTimeout(r, SLOW_MS))
    yield { facet: 'slow', at: Date.now() }
  }),
})

const server = createHTTPServer({ router })
let url = ''
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, r))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

test('chunks reach the query cache as they are yielded, not at the end', async () => {
  const client = createTRPCClient<typeof router>({
    links: [httpBatchStreamLink({ url })],
  })
  const qc = new QueryClient()
  const seen: Array<{ chunks: number; ms: number }> = []
  const start = Date.now()
  qc.getQueryCache().subscribe((e) => {
    const data = e.query.state.data as Array<unknown> | undefined
    if (e.type === 'updated' && data && seen.at(-1)?.chunks !== data.length) {
      seen.push({ chunks: data.length, ms: Date.now() - start })
    }
  })
  const data = await qc.fetchQuery({
    queryKey: ['facets'],
    queryFn: experimental_streamedQuery({
      streamFn: () => client.facets.query(),
    }),
  })
  expect(data.map((d) => d.facet)).toEqual(['fast', 'slow'])
  const [first] = seen
  const slowYieldedAt = (data[1] as { at: number }).at
  // Same process, same clock: the first chunk was in the cache before the
  // server even yielded the second, whatever the machine's speed.
  expect({
    firstAlone: first?.chunks,
    firstBeforeSlowWasYielded: start + (first?.ms ?? Infinity) < slowYieldedAt,
  }).toEqual({ firstAlone: 1, firstBeforeSlowWasYielded: true })
})
