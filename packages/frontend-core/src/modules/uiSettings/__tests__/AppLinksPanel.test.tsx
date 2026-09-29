import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { BootstrapConfigData } from '@env-hopper/backend-core'
import type { EhUiSettings } from '~/types/uiSettings'
import { BootstrapConfigProvider } from '~/modules/config/BootstrapConfigContext'
import { AppLinksPanel } from '~/modules/uiSettings/AppLinksPanel'
import { UiSettingsContext } from '~/modules/uiSettings/UiSettingsContext'

// A jump slug is app+page flattened. `lims-tasks@console` is the real shape of a
// single-page app whose one page is not named `home`, and the app it belongs to
// is keyed as `lims-tasks`.
const JUMP_SLUG = 'lims-tasks@console'
const APP_SLUG = 'lims-tasks'

const currentResourceJump = { slug: JUMP_SLUG, displayName: 'Console' }
const currentEnv = {
  slug: 'staging',
  displayName: 'Staging',
  templateParams: { subdomain: 'staging' },
}

vi.mock('~/modules/environment/context/EnvironmentContext', () => ({
  useEnvironmentContext: () => ({ currentEnv }),
}))
vi.mock('~/modules/resourceJump/context/ResourceJumpContext', () => ({
  useResourceJumpContext: () => ({ currentResourceJump }),
}))

const bootstrap: BootstrapConfigData = {
  // Keyed by app, which is the whole point: the jump slug is not this key.
  apps: {
    [APP_SLUG]: {
      slug: APP_SLUG,
      displayName: 'Lims Tasks',
      meta: { dashboard: 'ops-overview' },
    },
  },
  envs: {
    staging: {
      slug: 'staging',
      displayName: 'Staging',
      meta: { region: 'eu' },
    },
  },
  appsMeta: { tags: { descriptions: [] } },
  contexts: [],
  defaults: { envSlug: 'staging', resourceJumpSlug: JUMP_SLUG },
}

const uiSettings: EhUiSettings = {
  appLinks: [
    {
      id: 'dashboard',
      icon: null,
      title: 'Dashboard for {{app.slug}}',
      url: 'https://dash.example.com/{{app.meta.dashboard}}?env={{env.slug}}',
    },
  ],
}

function renderPanel(settings: EhUiSettings = uiSettings) {
  return render(
    <BootstrapConfigProvider bootstrapConfig={bootstrap}>
      <UiSettingsContext value={settings}>
        <AppLinksPanel />
      </UiSettingsContext>
    </BootstrapConfigProvider>,
  )
}

describe('AppLinksPanel with an app whose jump slug carries a page suffix', () => {
  it('renders the panel rather than disappearing', () => {
    renderPanel()

    // The user-visible symptom: every link is skipped when app meta cannot be
    // found, and the panel returns null, which reads as missing configuration.
    expect(screen.queryByTestId('eh-app-links')).not.toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('resolves app meta for the app the jump belongs to', () => {
    renderPanel()

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://dash.example.com/ops-overview?env=staging',
    )
  })

  it('resolves {{app.slug}} to the app, not the jump', () => {
    renderPanel()

    expect(screen.getByRole('link')).toHaveTextContent(
      'Dashboard for lims-tasks',
    )
    expect(screen.getByRole('link')).not.toHaveTextContent(JUMP_SLUG)
  })

  it('still skips a link whose url genuinely cannot resolve', () => {
    renderPanel({
      appLinks: [
        {
          id: 'unknown',
          icon: null,
          title: 'Unknown',
          url: 'https://example.com/{{app.meta.nope}}',
        },
      ],
    })

    expect(screen.queryByTestId('eh-app-links')).toBeNull()
  })
})
