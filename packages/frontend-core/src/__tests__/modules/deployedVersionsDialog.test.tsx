import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeployedVersions } from '~/modules/deployments/DeployedVersions'
import { pairFacetKey } from '~/modules/pairDetails/pairDetails'
import { BootstrapConfigProvider } from '~/modules/config/BootstrapConfigContext'
import type { BootstrapPayload, PairDeployment } from '@env-hopper/backend-core'

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

    const bootstrap: BootstrapPayload = {
      apps: { shop: { slug: 'shop', displayName: 'Shop' } },
      envs: {},
      envDefaults: {},
      appsMeta: { tags: { descriptions: [] } },
      contexts: [],
      defaults: { envSlug: '', resourceJumpSlug: '' },
    }

    render(
      <QueryClientProvider client={client}>
        <BootstrapConfigProvider bootstrapConfig={bootstrap}>
          <DeployedVersions jumpSlug="shop" envSlug="qa" />
        </BootstrapConfigProvider>
      </QueryClientProvider>,
    )

    const columns = screen
      .getAllByRole('columnheader', { hidden: true })
      .filter((th) => th.getAttribute('scope') === 'col')
    expect(columns.map((c) => c.textContent)).toEqual([
      expect.stringMatching(/^Shop UImain/),
      'Shop API',
    ])
  })

  it('a running attempt that succeeds turns into the Version, then the line is as before', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const client = new QueryClient()
      const key = pairFacetKey('shop', 'qa', 'deployment')
      const deployed = (version: string, attempt?: object): PairDeployment => ({
        components: [{ slug: 'shop-ui', displayName: 'Shop UI', lead: true }],
        users: {},
        rows: [
          {
            componentSlug: 'shop-ui',
            targetSlug: 'k8s:qa/shop-ui',
            version,
            aliases: [],
            source: 'k8s',
            ...(attempt && { attempt }),
          } as PairDeployment['rows'][number],
        ],
      })
      client.setQueryData(
        key,
        deployed('main-41', {
          version: 'main-42',
          status: 'running',
          targetSlug: 'k8s:qa/shop-ui',
        }),
      )
      const bootstrap = {
        apps: { shop: { slug: 'shop', displayName: 'Shop' } },
        envs: {},
        envDefaults: {},
        appsMeta: { tags: { descriptions: [] } },
        contexts: [],
        defaults: { envSlug: '', resourceJumpSlug: '' },
      } as BootstrapPayload
      const { container } = render(
        <QueryClientProvider client={client}>
          <BootstrapConfigProvider bootstrapConfig={bootstrap}>
            <DeployedVersions jumpSlug="shop" envSlug="qa" />
          </BootstrapConfigProvider>
        </QueryClientProvider>,
      )
      const seen = () => ({
        chip: container.querySelector('.eh-deployed-chip')?.textContent ?? null,
        swapIn:
          container.querySelector('.eh-deployed-swap-in')?.textContent ?? null,
        swapOut:
          container.querySelector('.eh-deployed-swap-out')?.textContent ?? null,
      })
      const running = seen()

      act(() => client.setQueryData(key, deployed('main-42')))
      // The cache tells its readers on the next tick.
      await act(() => vi.advanceTimersByTimeAsync(1))
      const swapping = seen()
      await act(() => vi.advanceTimersByTimeAsync(3200))

      expect({ running, swapping, after: seen() }).toEqual({
        running: { chip: '↻ deploying main-42', swapIn: null, swapOut: null },
        swapping: { chip: null, swapIn: 'main-42', swapOut: 'main-41' },
        after: { chip: null, swapIn: null, swapOut: null },
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
