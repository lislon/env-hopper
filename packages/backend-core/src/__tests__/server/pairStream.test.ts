// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { perPair, streamSources } from '../../server/pairDetails'
import type { PairChunk } from '../../server/pairDetails'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('a source that answers per pair', () => {
  it('sends each pair the moment its own data is ready, never after the whole slice', async () => {
    // 100 pairs, each ready after its own delay: a distinct 3 ms step, shuffled.
    const delays = Array.from({ length: 100 }, (_, i) => (i + 1) * 3).sort(
      () => Math.random() - 0.5,
    )
    const pairs = delays.map((_, i) => ({ app: `app${i}`, env: 'qa' }))
    const delayOf = new Map(pairs.map((p, i) => [p.app, delays[i]!]))
    const start = Date.now()
    const arrived: Array<{ app: string; ms: number }> = []
    for await (const c of streamSources([
      {
        facets: ['deployment'],
        chunks: perPair(pairs, 'deployment', async ({ app, env }) => {
          await sleep(delayOf.get(app)!)
          if (app === 'app7') throw new Error('this one fails')
          return [{ app, env, facet: 'deployment', data: { rows: [] } }]
        }),
      },
    ])) {
      arrived.push({ app: (c as { app: string }).app, ms: Date.now() - start })
    }
    const slowest = Math.max(...delays)
    expect(arrived.map((a) => a.app)).toEqual(
      [...pairs]
        .sort((a, b) => delayOf.get(a.app)! - delayOf.get(b.app)!)
        .map((p) => p.app),
    )
    expect(arrived[0]!.ms).toBeLessThan(slowest / 2)
    console.log(
      `[perPair] first of 100 at ${arrived[0]!.ms} ms, last at ${arrived.at(-1)!.ms} ms (slowest ${slowest} ms)`,
    )
  })

  it('a failing pair gets an error chunk; the other sources still arrive', async () => {
    const chunks: Array<PairChunk> = []
    for await (const c of streamSources([
      {
        facets: ['deployment'],
        chunks: perPair([{ app: 'a', env: 'qa' }], 'deployment', () =>
          Promise.reject(new Error('down')),
        ),
      },
      {
        facets: ['credentials'],
        chunks: (async function* (): AsyncGenerator<PairChunk> {
          await sleep(5)
          yield { env: 'qa', facet: 'credentials', data: {} }
        })(),
      },
      {
        facets: ['jumps'],
        chunks: {
          [Symbol.asyncIterator]: () => ({
            next: () => sleep(1).then(() => Promise.reject(new Error('down'))),
          }),
        },
      },
    ]))
      chunks.push(c)
    expect(chunks).toEqual([
      { app: 'a', env: 'qa', facet: 'deployment', error: 'source failed' },
      { facet: 'jumps', error: 'source failed' },
      { env: 'qa', facet: 'credentials', data: {} },
    ])
  })
})
