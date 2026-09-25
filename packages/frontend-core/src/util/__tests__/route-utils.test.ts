import { describe, expect, it } from 'vitest'
import { appSlugFromJumpSlug, getEhToOptions } from '~/util/route-utils'

describe('appSlugFromJumpSlug', () => {
  it('leaves a grouped app alone, since a group slug carries no page', () => {
    expect(appSlugFromJumpSlug('orders')).toBe('orders')
  })

  it('drops the page from a child page of a grouped app', () => {
    expect(appSlugFromJumpSlug('orders@shipments')).toBe('orders')
  })

  it('drops the page from a single-page app whose page is not named home', () => {
    // The regression this guards: such an app is deliberately not grouped, so
    // its slug is the jump's own — and the jump slug keeps the page suffix.
    // Keyed by the raw slug, its `{{app.meta.*}}` placeholders never resolved.
    expect(appSlugFromJumpSlug('reports@dashboard')).toBe('reports')
  })
})

describe('getEhToOptions', () => {
  it('carries a sub value so a shared link keeps what the page is about', () => {
    expect(
      getEhToOptions({
        envId: 'staging',
        appId: 'orders',
        subValue: 'ORD-4821',
      }),
    ).toMatchObject({
      to: '/env/$envSlug/app/$appSlug/sub/$subValue',
      params: {
        envSlug: 'staging',
        appSlug: 'orders',
        subValue: 'ORD-4821',
      },
    })
  })

  it('escapes a sub value that contains url-significant characters', () => {
    expect(
      getEhToOptions({ envId: 'staging', appId: 'orders', subValue: 'a/b c' }),
    ).toMatchObject({ params: { subValue: 'a%2Fb%20c' } })
  })

  it('omits the sub segment when there is no value', () => {
    expect(getEhToOptions({ envId: 'staging', appId: 'orders' })).toMatchObject(
      {
        to: '/env/$envSlug/app/$appSlug',
      },
    )
  })

  it('keeps the app when no environment is chosen yet', () => {
    // Falling through to `/` here dropped the selection and stripped the app out
    // of the link the share button offers.
    expect(getEhToOptions({ appId: 'orders' })).toMatchObject({
      to: '/app/$appSlug',
      params: { appSlug: 'orders' },
    })
  })

  it('keeps the sub value when no environment is chosen yet', () => {
    expect(
      getEhToOptions({ appId: 'orders', subValue: 'ORD-4821' }),
    ).toMatchObject({
      to: '/app/$appSlug/sub/$subValue',
      params: { appSlug: 'orders', subValue: 'ORD-4821' },
    })
  })

  it('keeps the env-only and root shapes', () => {
    expect(getEhToOptions({ envId: 'staging' })).toMatchObject({
      to: '/env/$envSlug',
    })
    expect(getEhToOptions({})).toMatchObject({ to: '/' })
  })
})
