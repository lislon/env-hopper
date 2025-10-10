import { waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { renderApp } from './helpers/renderWithProviders'

describe('AppQuickJumpBar Integration', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  test('clicking app quick jump button updates URL', async () => {
    const { ui } = await renderApp({
      server,
      initialLink: '/env/dev',
    })

    // Click first app via quick bar helper (labels may vary by dataset)
    await ui.resourceJump.quickBar.clickFirst()

    // Verify URL changed to include the app
    await waitFor(() => expect(ui.getCurrentPath()).toBe('/env/dev/app/app1'))
  })
})
