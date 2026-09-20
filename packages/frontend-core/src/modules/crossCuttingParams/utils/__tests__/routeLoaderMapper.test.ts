import { mapValues } from 'radashi'
import { describe, expect, it } from 'vitest'
import type { ResourceJumpsData } from '@env-hopper/backend-core'
import { routeLoaderMapper } from '~/modules/crossCuttingParams/utils/routeLoaderMapper'
import { buildJumpUrl } from '~/modules/resourceJump/utils/buildJumpUrl'

const resourceJumpsData: ResourceJumpsData = {
  lateResolvableParams: [
    { slug: 'orderId', displayName: 'Order ID' },
    { slug: 'lineId', displayName: 'Line ID' },
  ],
  resourceJumps: [
    {
      slug: 'order-detail',
      displayName: 'Order detail',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/orders/{{orderId}}',
      },
      // Ordered as the params appear in the template, so index 0 is the one a
      // legacy /sub/ value belongs to.
      lateResolvableParamSlugs: ['orderId', 'lineId'],
    },
    {
      slug: 'order-list',
      displayName: 'Order list',
      urlTemplate: { default: 'https://{{subdomain}}.example.com/orders' },
    },
  ],
  envs: [
    {
      slug: 'staging',
      displayName: 'Staging',
      templateParams: { subdomain: 'staging' },
    },
  ],
}

function findJump(slug: string) {
  return resourceJumpsData.resourceJumps.find((rj) => rj.slug === slug)
}

describe('routeLoaderMapper', () => {
  it("maps a legacy sub value onto the jump's first late-resolvable param", () => {
    const result = routeLoaderMapper('ORD-4821', findJump('order-detail'))

    expect(result).toEqual([{ slug: 'orderId', stringValue: 'ORD-4821' }])
  })

  it('maps nothing when the jump takes no late-resolvable param', () => {
    expect(routeLoaderMapper('ORD-4821', findJump('order-list'))).toEqual([])
  })

  it('maps nothing without a sub value or a known jump', () => {
    expect(routeLoaderMapper(undefined, findJump('order-detail'))).toEqual([])
    expect(routeLoaderMapper('ORD-4821', undefined)).toEqual([])
  })

  it('keeps an empty sub value, which is a value the user can have shared', () => {
    expect(routeLoaderMapper('', findJump('order-detail'))).toEqual([
      { slug: 'orderId', stringValue: '' },
    ])
  })
})

describe('a legacy /env/<env>/app/<app>/sub/<value> link', () => {
  // The whole point: the intermediate state looked fine before, the target url
  // was what silently lost the value.
  it('resolves to a fully substituted target url', () => {
    const crossCuttingParams = routeLoaderMapper(
      'ORD-4821',
      findJump('order-detail'),
    )

    const url = buildJumpUrl(
      'order-detail',
      'staging',
      resourceJumpsData,
      mapValues(
        Object.fromEntries(crossCuttingParams.map((p) => [p.slug, p])),
        (p) => p.stringValue,
      ),
    )

    expect(url).toBe('https://staging.example.com/orders/ORD-4821')
  })

  it('left the value unsubstituted when stored under a slug no template names', () => {
    const url = buildJumpUrl('order-detail', 'staging', resourceJumpsData, {
      'sub-legacy': 'ORD-4821',
    })

    expect(url).toBe('https://staging.example.com/orders/{{orderId}}')
  })
})
