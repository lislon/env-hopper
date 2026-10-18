import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { applyPush, pairFacetKey } from '~/modules/pairDetails/pairDetails'
import type { PairDeployment } from '@env-hopper/backend-core'

const row = (version: string) => ({
  componentSlug: 'shop-api',
  targetSlug: 'k8s:prod/shop',
  version,
  aliases: [],
  source: 'ci',
})

describe('applyPush', () => {
  it('replaces the cached deployment of a pushed pair, and leaves other pairs alone', async () => {
    const client = new QueryClient()
    const old: PairDeployment = { components: [], users: {}, rows: [row('v1')] }
    client.setQueryData(pairFacetKey('shop', 'prod', 'deployment'), old)
    client.setQueryData(pairFacetKey('shop', 'qa', 'deployment'), old)

    await applyPush(client, [
      {
        app: 'shop',
        facet: 'components',
        data: [{ slug: 'shop-api', displayName: 'API', lead: true }],
      },
      {
        app: 'shop',
        env: 'prod',
        facet: 'deployment',
        data: { rows: [row('v2')] },
      },
    ])

    expect(
      client.getQueryData<PairDeployment>(
        pairFacetKey('shop', 'prod', 'deployment'),
      ),
    ).toEqual({
      components: [{ slug: 'shop-api', displayName: 'API', lead: true }],
      users: {},
      rows: [row('v2')],
    })
    expect(client.getQueryData(pairFacetKey('shop', 'qa', 'deployment'))).toBe(
      old,
    )
  })
})
