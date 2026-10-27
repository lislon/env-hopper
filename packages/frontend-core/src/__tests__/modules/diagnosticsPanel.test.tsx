import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DiagnosticsPanel,
  diagnosticsJson,
} from '~/modules/diagnostics/DiagnosticsPanel'
import { recordPageEvent } from '~/modules/diagnostics/diagnosticsLog'
import { BootstrapConfigProvider } from '~/modules/config/BootstrapConfigContext'
import type { BootstrapPayload } from '@env-hopper/backend-core'

const bootstrap = (diagnostics?: boolean) =>
  ({
    apps: {},
    envs: {},
    envDefaults: {},
    appsMeta: { tags: { descriptions: [] } },
    contexts: [],
    defaults: { envSlug: '', resourceJumpSlug: '' },
    ...(diagnostics !== undefined && { ui: { diagnostics } }),
  }) as BootstrapPayload

const panelShown = (diagnostics?: boolean) => {
  const { container, unmount } = render(
    <QueryClientProvider client={new QueryClient()}>
      <BootstrapConfigProvider bootstrapConfig={bootstrap(diagnostics)}>
        <DiagnosticsPanel app="shop" env="qa" />
      </BootstrapConfigProvider>
    </QueryClientProvider>,
  )
  const shown = !!container.querySelector('[data-testid="diagnostics-panel"]')
  unmount()
  return shown
}

describe('diagnostics panel', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('opens with ?debug=1 only where the deployment turns it on', () => {
    window.history.replaceState(null, '', '/?debug=1')

    expect({
      unset: panelShown(),
      off: panelShown(false),
      on: panelShown(true),
    }).toEqual({ unset: false, off: false, on: true })
  })

  it('copies no secret-looking value', () => {
    recordPageEvent('pair-deployment', {
      app: 'shop',
      env: 'qa',
      dbPass: 'hunter2',
      note: `${'postgres'}://app:${'s3cret'}@db.example.com/eh and password=hunter2 and Bearer abc.def.ghi`,
      freshness: { checkedAt: '2026-10-26T10:00:00.000Z' },
    })

    const copied = diagnosticsJson({
      app: 'shop',
      env: 'qa',
      attentive: true,
      server: [{ at: 'x', kind: 'check', detail: 'ok', sessionCookie: 'c=1' }],
    })

    expect(
      ['hunter2', 's3cret', 'abc.def.ghi', 'dbPass', 'sessionCookie'].filter(
        (leak) => copied.includes(leak),
      ),
    ).toEqual([])
    expect(copied).toContain('2026-10-26T10:00:00.000Z')
  })
})
