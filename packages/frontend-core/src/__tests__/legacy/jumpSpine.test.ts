import { describe, expect, it } from 'vitest'
import type {
  BootstrapConfigData,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import { mapToLegacyConfig } from '~/legacy/adapter/legacyApi'
import {
  findSubstitutionIdByUrl,
  formatAppTitle,
  getJumpUrl,
  getJumpUrlEvenNotComplete,
} from '~/legacy/lib/utils'

/*
 * The two load-bearing pieces of the previous UI's jump form that are NOT a verbatim copy:
 * the mapping from the current payloads onto the previous vocabulary, and url building on
 * top of the current template resolver. Everything else in the port is markup, which the
 * pixel gate grades; these two are logic, and nothing else in this package covers them.
 */

const JUMPS: ResourceJumpsData = {
  envs: [
    { slug: 'env-a', displayName: 'Env A', templateParams: { host: 'a.test' } },
    { slug: 'env-b', displayName: 'Env B', templateParams: { host: 'b.test' } },
  ],
  lateResolvableParams: [
    { slug: 'orderId', displayName: 'Order ID' },
    { slug: 'unused', displayName: 'Unused' },
  ],
  resourceJumps: [
    {
      slug: 'shop-orders',
      displayName: 'Orders',
      urlTemplate: {
        default: 'https://{{host}}/orders/{{orderId}}',
        overrides: { 'env-b': 'https://legacy.{{host}}/o/{{orderId}}' },
      },
      lateResolvableParamSlugs: ['orderId'],
    },
    {
      slug: 'shop-health',
      displayName: 'Shop',
      urlTemplate: { default: 'https://{{host}}/health' },
    },
  ],
  groups: [
    {
      slug: 'shop',
      displayName: 'Shop',
      resourceSlugs: ['shop-health', 'shop-orders'],
    },
  ],
}

const BOOTSTRAP: BootstrapConfigData = {
  envs: {},
  apps: {},
  appsMeta: { tags: { descriptions: [] } },
  contexts: [
    { slug: 'orderId', displayName: 'Order ID', isSharedAcrossEnvs: true },
  ],
  defaults: { envSlug: 'env-a', resourceJumpSlug: 'shop-health' },
}

const config = mapToLegacyConfig(BOOTSTRAP, JUMPS)
const orders = config.apps.find((a) => a.id === 'shop-orders')!
const health = config.apps.find((a) => a.id === 'shop-health')!
const envA = config.envs.find((e) => e.id === 'env-a')!
const envB = config.envs.find((e) => e.id === 'env-b')!

describe('the previous config payload, assembled from the current procedures', () => {
  it('titles a jump by its group and its own name', () => {
    expect(formatAppTitle(orders)).toBe('Shop :: Orders')
  })

  it('drops the page half of the title when the jump names its whole group', () => {
    expect(formatAppTitle(health)).toBe('Shop')
  })

  it('carries the environment parameters the resolver needs', () => {
    expect(envA.templateParams).toEqual({ host: 'a.test' })
  })

  it('offers every late-resolvable parameter as a value type, with its flags', () => {
    expect(config.substitutions).toEqual([
      { id: 'orderId', title: 'Order ID', isSharedAcrossEnvs: true },
      { id: 'unused', title: 'Unused', isSharedAcrossEnvs: undefined },
    ])
  })
})

describe('url building', () => {
  it('fills the environment in and leaves the value placeholder standing', () => {
    expect(getJumpUrlEvenNotComplete({ app: orders, env: envA })).toBe(
      'https://a.test/orders/{{orderId}}',
    )
  })

  it('names the placeholder still waiting for a value', () => {
    expect(findSubstitutionIdByUrl({ app: orders, env: envA })).toBe('orderId')
    expect(findSubstitutionIdByUrl({ app: health, env: envA })).toBeUndefined()
  })

  it('refuses a url that still has a hole in it', () => {
    expect(getJumpUrl({ app: orders, env: envA })).toBeUndefined()
    expect(getJumpUrl({ app: health, env: envA })).toBe('https://a.test/health')
  })

  it('substitutes the value once it is given', () => {
    expect(
      getJumpUrl({
        app: orders,
        env: envA,
        substitution: { name: 'orderId', value: 'A-1' },
      }),
    ).toBe('https://a.test/orders/A-1')
  })

  it('honours the per-environment override instead of the default', () => {
    expect(
      getJumpUrl({
        app: orders,
        env: envB,
        substitution: { name: 'orderId', value: 'A-1' },
      }),
    ).toBe('https://legacy.b.test/o/A-1')
  })

  it('needs an environment before it will build anything', () => {
    expect(getJumpUrl({ app: health, env: undefined })).toBeUndefined()
  })
})
