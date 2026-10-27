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
        attempt:
          container.querySelector('.eh-deployed-attempt-text')?.textContent ??
          null,
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
        running: {
          attempt: 'New deployment main-42 is running',
          swapIn: null,
          swapOut: null,
        },
        swapping: {
          attempt: 'New deployment main-42 succeeded',
          swapIn: 'main-42',
          swapOut: 'main-41',
        },
        after: { attempt: null, swapIn: null, swapOut: null },
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('greys a Version older than its freshness, rings while it is read again, and says when a check failed', () => {
    const now = Date.parse('2026-10-26T10:00:00Z')
    vi.useFakeTimers({ now, shouldAdvanceTime: true })
    try {
      const ago = (s: number) => new Date(now - s * 1000).toISOString()
      const seen = (freshness: PairDeployment['freshness']) => {
        const client = new QueryClient()
        client.setQueryData(pairFacetKey('shop', 'qa', 'deployment'), {
          ...(freshness && { freshness }),
          components: [{ slug: 'shop-ui', displayName: 'Shop UI', lead: true }],
          users: {},
          rows: [
            {
              componentSlug: 'shop-ui',
              targetSlug: 'k8s:qa/shop-ui',
              version: 'main-41',
              aliases: [],
              source: 'k8s',
            },
          ],
        } satisfies PairDeployment)
        const { container, unmount } = render(
          <QueryClientProvider client={client}>
            <BootstrapConfigProvider
              bootstrapConfig={
                {
                  apps: { shop: { slug: 'shop', displayName: 'Shop' } },
                  envs: {},
                  envDefaults: {},
                  appsMeta: { tags: { descriptions: [] } },
                  contexts: [],
                  defaults: { envSlug: '', resourceJumpSlug: '' },
                  ui: { upToDateFreshnessMs: 30_000 },
                } as BootstrapPayload
              }
            >
              <DeployedVersions jumpSlug="shop" envSlug="qa" />
            </BootstrapConfigProvider>
          </QueryClientProvider>,
        )
        const line = container.querySelector('.eh-deployed-version')
        const out = {
          grey: !!line?.classList.contains('eh-deployed-dimmed'),
          verifying: !!container.querySelector('.eh-deployed-verify'),
          warn:
            container.querySelector('.eh-deployed-warn')?.textContent ?? null,
          // The tooltip's first line.
          tip:
            container.querySelector('.eh-deployed-row [role="tooltip"]')
              ?.firstChild?.textContent ?? null,
        }
        unmount()
        return out
      }

      expect({
        untracked: seen(undefined),
        upToDate: seen({ checkedAt: ago(5) }),
        stale: seen({ checkedAt: ago(41 * 60) }),
        checking: seen({ checkedAt: ago(41 * 60), reading: ['audit'] }),
        failed: seen({
          checkedAt: ago(41 * 60),
          failed: { source: 'audit', at: ago(10) },
        }),
      }).toEqual({
        untracked: {
          grey: false,
          verifying: false,
          warn: null,
          tip: 'no health check',
        },
        upToDate: {
          grey: false,
          verifying: false,
          warn: null,
          tip: 'Up to date · checked 5 s ago',
        },
        stale: {
          grey: true,
          verifying: false,
          warn: null,
          tip: 'May be out of date · last checked 41 min ago',
        },
        checking: {
          grey: true,
          verifying: true,
          warn: null,
          tip: 'May be out of date · checking audit now…',
        },
        failed: {
          grey: true,
          verifying: false,
          warn: "couldn't check · from 41 min ago",
          tip: "Couldn't check audit · showing the value from 41 min ago",
        },
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
