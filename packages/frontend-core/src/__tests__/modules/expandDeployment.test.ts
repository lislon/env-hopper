import { describe, expect, it } from 'vitest'
import { expandDeployment } from '~/modules/pairDetails/pairDetails'

describe('expandDeployment', () => {
  it('rebuilds links from ids, keeps full links, names only the Users its rows name', () => {
    const pipelines = 'https://ci.example.com/shop/-/pipelines/'
    const expanded = expandDeployment(
      {
        rows: [
          {
            componentSlug: 'api',
            targetSlug: 't1',
            version: 'v1',
            aliases: [],
            source: 'ci',
            deployedBy: 'ann',
            buildPipelineId: '7',
            deployUrl: 'https://other.example.com/d/1',
            health: { state: 'healthy', checker: 'http' },
          },
          {
            componentSlug: 'ui',
            targetSlug: 't2',
            version: 'v2',
            aliases: [],
            source: 'ci',
            deployPipelineId: '9',
            health: {
              state: 'down',
              checker: 'k8s',
              observedAt: '2026-10-18T10:05:00Z',
              detail: 'CrashLoopBackOff',
            },
          },
        ],
      },
      [
        {
          slug: 'api',
          displayName: 'API',
          lead: true,
          pipelineUrl: `${pipelines}{{id}}`,
        },
        { slug: 'ui', displayName: 'UI' },
      ],
      { ann: { firstName: 'Ann' }, bob: { firstName: 'Bob' } },
      { observedAt: '2026-10-18T10:00:00Z' },
    )
    expect(expanded).toEqual({
      components: [
        { slug: 'api', displayName: 'API', lead: true },
        { slug: 'ui', displayName: 'UI' },
      ],
      users: { ann: { firstName: 'Ann' } },
      rows: [
        {
          componentSlug: 'api',
          targetSlug: 't1',
          version: 'v1',
          aliases: [],
          source: 'ci',
          deployedBy: 'ann',
          buildUrl: `${pipelines}7`,
          deployUrl: 'https://other.example.com/d/1',
          // The stream's run time, where the row sent none.
          health: {
            state: 'healthy',
            checker: 'http',
            observedAt: '2026-10-18T10:00:00Z',
          },
        },
        // No template for its Component: the id alone builds nothing.
        {
          componentSlug: 'ui',
          targetSlug: 't2',
          version: 'v2',
          aliases: [],
          source: 'ci',
          health: {
            state: 'down',
            checker: 'k8s',
            observedAt: '2026-10-18T10:05:00Z',
            detail: 'CrashLoopBackOff',
          },
        },
      ],
    })
  })
})
