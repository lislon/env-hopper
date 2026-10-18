import { describe, expect, it } from 'vitest'
import { expandEnv, packEnvs } from '../packEnvs.js'

const roundTrips = (records: Record<string, unknown>) => {
  const packed = packEnvs(records)
  for (const slug of Object.keys(records)) {
    expect({ slug, env: expandEnv(packed, slug) }).toEqual({
      slug,
      env: records[slug],
    })
  }
  expect(Object.keys(packed.envs)).toEqual(Object.keys(records))
  return packed
}

const env = (slug: string, extra: Record<string, unknown> = {}) => ({
  slug,
  displayName: slug,
  meta: {
    baseDomain: 'example.com',
    path: `/dash/${slug}/home`,
    profile: `p${slug.replaceAll('-', '')}`,
  },
  ...extra,
})

describe('packEnvs', () => {
  it('sends what most records share once, per field', () => {
    const records = Object.fromEntries(
      ['qa-1', 'qa-2', 'stage-03'].map((s) => [s, env(s)]),
    )
    const packed = roundTrips(records)
    expect(packed.envDefaults).toEqual({
      slug: '{{env.slug}}',
      displayName: '{{env.slug}}',
      meta: {
        baseDomain: 'example.com',
        path: '/dash/{{env.slug}}/home',
        profile: 'p{{env.slug|nodash}}',
      },
    })
    expect(packed.envs).toEqual({ 'qa-1': {}, 'qa-2': {}, 'stage-03': {} })
  })

  it('records that differ carry their own value, and drop defaults they lack', () => {
    const records = {
      a: env('a'),
      b: env('b'),
      c: env('c'),
      d: { slug: 'd', displayName: 'Dee', meta: { baseDomain: 'other.org' } },
    }
    const packed = roundTrips(records)
    expect(packed.envs['d']).toEqual({
      displayName: 'Dee',
      meta: { baseDomain: 'other.org', path: null, profile: null },
    })
  })

  it('emits no rule that costs more than it saves', () => {
    const records = {
      a: { slug: 'a', rare: 'x' },
      b: { slug: 'b' },
      c: { slug: 'c' },
      d: { slug: 'd' },
    }
    expect(roundTrips(records).envDefaults).not.toHaveProperty('rare')
  })

  it('three records that share nothing still round-trip', () => {
    const records = {
      one: { id: 1, name: 'Alpha', tags: ['x'], nested: { deep: true } },
      two: { label: 'beta', list: [], meta: {} },
      three: { other: null, n: 3.5, s: 'gamma {{x ?? y}}' },
    }
    const packed = roundTrips(records)
    expect(JSON.stringify(packed).length).toBeLessThan(
      JSON.stringify(records).length + 40,
    )
  })

  it('a value that already holds a placeholder is sent as it is', () => {
    const records = Object.fromEntries(
      ['a-1', 'a-2', 'a-3'].map((s) => [s, { slug: s, raw: '{{env.slug}}' }]),
    )
    expect(roundTrips(records).envs['a-1']).toHaveProperty('raw')
  })

  it('a null a record really holds survives', () => {
    const records = {
      a: { slug: 'a', k: 'v' },
      b: { slug: 'b', k: 'v' },
      c: { slug: 'c', k: null },
    }
    expect(expandEnv(roundTrips(records), 'c')).toHaveProperty('k', null)
  })

  it('an unpacked list (no defaults) expands to itself', () => {
    const plain = { envs: { a: { slug: 'a', displayName: 'A' } } }
    expect(expandEnv(plain, 'a')).toEqual({ slug: 'a', displayName: 'A' })
    expect(expandEnv(plain, 'missing')).toBeUndefined()
  })
})
