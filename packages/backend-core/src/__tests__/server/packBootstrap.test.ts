import { describe, expect, it } from 'vitest'
import { packBootstrap } from '../../server/controller'
import type { BootstrapConfigData } from '../../types'

const data = (subdomain: string) =>
  ({
    envs: { qa: { slug: 'qa', displayName: 'qa', meta: { subdomain } } },
    apps: {},
  }) as unknown as BootstrapConfigData

describe('packBootstrap', () => {
  it('packs an object once, and a new object again', () => {
    const first = data('q')
    const packed = packBootstrap(first)
    expect(packBootstrap(first)).toBe(packed)
    const next = packBootstrap(data('p'))
    expect(next).not.toBe(packed)
    expect(next).toEqual(packBootstrap(data('p')))
    expect(JSON.stringify(next)).not.toBe(JSON.stringify(packed))
  })
})
