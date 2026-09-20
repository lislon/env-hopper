import { describe, expect, it } from 'vitest'
import { getEhToOptions } from '~/util/route-utils'

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

  it('keeps the env-only and root shapes', () => {
    expect(getEhToOptions({ envId: 'staging' })).toMatchObject({
      to: '/env/$envSlug',
    })
    expect(getEhToOptions({})).toMatchObject({ to: '/' })
  })
})
