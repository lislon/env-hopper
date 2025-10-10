import { waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { renderApp } from './helpers/renderWithProviders'
import { createDeferred } from './helpers/testHelpers'
import { dbCacheDbKeys } from '~/userDb/EhDb'

describe('Integration Testing Framework', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  test('user opens site with URL and sees it in the button', async () => {
    const { ui } = await renderApp({
      server,
      initialLink: '/env/dev/app/app1',
    })

    // Get the jump button state and verify URL
    const { url } = ui.resourceJump.jump.getState()
    expect(url).toBe('http://localhost:4000/env/dev/app/app1')
  })

  test('selecting environment changes URL to /env/dev', async () => {
    // trpcMsw.bootstrap.query((req, res, ctx) => res.data(JSON.stringify(fullBackend.bootstrap))),
    // trpcMsw.resourceJumps.query((req, res, ctx) => res.data(JSON.stringify(fullBackend.resourceJumps))),

    const { ui } = await renderApp({
      server,
    })

    // Select the dev environment
    await ui.resourceJump.env.select('dev')

    // Verify URL changed to env-only path
    expect(ui.getCurrentPath()).toBe('/env/dev')
  })

  test('selecting environment and app changes URL to /env/dev/app/app1', async () => {
    const { ui } = await renderApp({
      server,
    })

    // Select the dev environment
    await ui.resourceJump.env.select('dev')

    // Select the app1 resource (using the correct display name)
    await ui.resourceJump.resource.select('App1')

    // Verify URL changed to env+app path
    expect(ui.getCurrentPath()).toBe('/env/dev/app/app1')
  })

  test('navigating to full URL with existing app should stay on full URL', async () => {
    // renderApp by default waits for full load of the app before returning
    const { ui } = await renderApp({
      server,
      initialLink: '/env/dev/app/app1',
      throwOnError: false,
    })

    // Should stay on the full URL, not redirect to env-only
    expect(ui.getCurrentPath()).toBe('/env/dev/app/app1')

    // Both environment and app should be selected
    const selectedEnvTitle = ui.resourceJump.env.getSelectedTitle()
    const selectedAppTitle = ui.resourceJump.resource.getSelectedTitle()

    expect(selectedEnvTitle).toBe('Dev')
    expect(selectedAppTitle).toBe('App1')
  })

  test('placeholder text shows URL slugs while data is loading', async () => {
    const bootstrapDeferred = createDeferred()
    const resourceJumpsDeferred = createDeferred()

    const { container } = await renderApp({
      server,
      initialLink: '/env/develop-5000/app/prodlims-case-view',
      waitForFullLoad: false,
      throwOnError: false,
      overrideBackendNetwork: (srv, mswTrpc, backendData) => {
        srv.use(
          mswTrpc.bootstrap.query(() =>
            bootstrapDeferred.defer(backendData.bootstrap),
          ),
          mswTrpc.resourceJumps.query(() =>
            resourceJumpsDeferred.defer(backendData.resourceJumps),
          ),
        )
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(
      container.querySelector('input[placeholder*="Develop 5000"]'),
    ).toBeTruthy()

    bootstrapDeferred.resolve()
    resourceJumpsDeferred.resolve()
  })

  test('resourceJumps data is cached to IndexedDB after fetch', async () => {
    const { db } = await renderApp({
      server,
    })

    // Query IndexedDB directly to verify data was stored
    const cachedData = await db.resourceJumps.get(dbCacheDbKeys.ResourceJumps)

    expect(cachedData).toBeDefined()
    expect(cachedData?.resourceJumps[0]?.slug).toBe('app1')
  })

  test('app loads from cached resourceJumps when network fails', async () => {
    const { db: dbFirst } = await renderApp({
      server,
    })

    // Verify cache was populated
    const cachedData = await dbFirst.resourceJumps.get(
      dbCacheDbKeys.ResourceJumps,
    )
    expect(cachedData).toBeDefined()

    // Now simulate network failure
    server.resetHandlers()

    // Create a new app instance that will try to fetch but should fall back to cache
    const { ui } = await renderApp({
      server,
      initialLink: '/env/dev/app/app1',
      throwOnError: false, // Allow errors since network will fail
      overrideBackendNetwork: (srv, mswTrpc, backendData) => {
        srv.use(
          mswTrpc.bootstrap.query(() => {
            return backendData.bootstrap
          }),
          mswTrpc.resourceJumps.query(() => {
            // Simulate network error / gateway timeout
            throw new Error('Network request failed')
          }),
        )
      },
    })

    // Verify we can load from cache and the path is correct
    expect(ui.getCurrentPath()).toBe('/env/dev/app/app1')
  })

  test('typing into late param updates URL and jump URL', async () => {
    const { ui, user } = await renderApp({
      server,
      initialLink: '/env/dev/app/app1-order/sub/123',
    })

    // Ensure initial seed is applied before typing
    await waitFor(() => {
      expect(ui.getCurrentPath()).toBe('/env/dev/app/app1-order/sub/123')
    })

    // Find the parameter input by its label via reusable UI helper
    const paramInput = await ui.resourceJump.parameters.getInput('Order Id')

    // Ensure the input reflects seeded value before typing
    await waitFor(() => {
      expect((paramInput as HTMLInputElement).value).toBe('123')
    })

    // Type one character and commit with Enter
    await user.type(paramInput, '4')
    await user.keyboard('{Enter}')

    // Expect URL path to include updated sub value
    await waitFor(() => {
      expect(ui.getCurrentPath()).toBe('/env/dev/app/app1-order/sub/1234')
    })

    // Expect Jump button URL reflects updated sub value
    expect(ui.resourceJump.jump.getUrl()).toContain('1234')
  })
})
