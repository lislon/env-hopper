import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeployedVersions } from '~/modules/deployments/DeployedVersions'
import { pairFacetKey } from '~/modules/pairDetails/pairDetails'
import type { PairDeployment } from '@env-hopper/backend-core'

describe('DeployedVersions details', () => {
  it("puts the lead Component's column first, whatever order the Components came in", () => {
    const client = new QueryClient()
    const row = (componentSlug: string, version: string) => ({
      componentSlug,
      targetSlug: `k8s:qa/${componentSlug}`,
      version,
      aliases: [],
      source: 'k8s',
    })
    const data: PairDeployment = {
      // Sorted by slug, as the catalog returns them: the lead is second.
      components: [
        { slug: 'shop-api', displayName: 'Shop API' },
        { slug: 'shop-ui', displayName: 'Shop UI', lead: true },
      ],
      users: {},
      rows: [row('shop-api', 'a1'), row('shop-ui', 'u1')],
    }
    client.setQueryData(pairFacetKey('shop', 'qa', 'deployment'), data)

    render(
      <QueryClientProvider client={client}>
        <DeployedVersions jumpSlug="shop" envSlug="qa" />
      </QueryClientProvider>,
    )

    const columns = screen.getAllByRole('columnheader', { hidden: true })
    expect(columns.map((c) => c.textContent)).toEqual([
      expect.stringMatching(/^Shop UImain/),
      'Shop API',
    ])
  })
})
