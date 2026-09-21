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
  // `order-list` is the group's first page and takes no param of its own, so it
  // is the case where the value has to fall back to a sibling's param.
  groups: [
    {
      slug: 'orders',
      displayName: 'Orders',
      resourceSlugs: ['order-list', 'order-detail'],
    },
  ],
}

// Without groups the value can only be named by the jump the url points at.
const ungrouped: ResourceJumpsData = { ...resourceJumpsData, groups: [] }

describe('routeLoaderMapper', () => {
  it("maps a legacy sub value onto the jump's first late-resolvable param", () => {
    const result = routeLoaderMapper(
      'ORD-4821',
      'order-detail',
      resourceJumpsData,
    )

    expect(result).toEqual([{ slug: 'orderId', stringValue: 'ORD-4821' }])
  })

  // The page the url names offers the group's parameter field, so a link that
  // lands on it has to prefill that field rather than drop the value.
  it("falls back to the group's first late-resolvable param", () => {
    expect(
      routeLoaderMapper('ORD-4821', 'order-list', resourceJumpsData),
    ).toEqual([{ slug: 'orderId', stringValue: 'ORD-4821' }])
  })

  it('maps nothing when neither the jump nor its group takes a param', () => {
    expect(routeLoaderMapper('ORD-4821', 'order-list', ungrouped)).toEqual([])
  })

  it('maps nothing without a sub value or a known jump', () => {
    expect(
      routeLoaderMapper(undefined, 'order-detail', resourceJumpsData),
    ).toEqual([])
    expect(routeLoaderMapper('ORD-4821', undefined, resourceJumpsData)).toEqual(
      [],
    )
    expect(
      routeLoaderMapper('ORD-4821', 'no-such-jump', resourceJumpsData),
    ).toEqual([])
  })

  it('keeps an empty sub value, which is a value the user can have shared', () => {
    expect(routeLoaderMapper('', 'order-detail', resourceJumpsData)).toEqual([
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
      'order-detail',
      resourceJumpsData,
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
