import { createMemoryHistory } from '@tanstack/react-router'
import { render, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { createTRPCClient, httpLink } from '@trpc/client'
import { vi } from 'vitest'
import { BackendMagazine } from '../factories/BackendMagazine'
import { DbMagazine } from '../factories/DbMagazine'
import { createResourceJumpUI } from './uiHelpers'
import type { SetupServerApi } from 'msw/node'
import type { DbMagazineInstance } from '../factories/DbMagazine'
import type { createFullBackend } from '../factories/simpleDSL'
import type { TRPCRouter } from '@env-hopper/backend-core'
import { createQueryClient } from '~/api/infra/createQueryClient'
import { App } from '~/App'
import { EhDb } from '~/userDb/EhDb'
import { createEhRouter } from '~/util/createEhRouter'

type FullBackend = ReturnType<typeof createFullBackend>
type OverrideBackendNetworkFn = Parameters<
  FullBackend['overrideBackendNetwork']
>[0]

interface RenderAppOptions {
  server: SetupServerApi
  backend?: ReturnType<typeof createFullBackend>
  overrideBackendNetwork?: OverrideBackendNetworkFn
  initialLink?: string
  httpBehavior?: {
    errors?: Record<string, Error>
  }
  waitForFullLoad?: boolean
  throwOnError?: boolean
  dbMagazine?: DbMagazineInstance
}

export async function renderApp(options: RenderAppOptions): Promise<
  {
    user: ReturnType<typeof userEvent.setup>
    queryClient: ReturnType<typeof createQueryClient>
    router: ReturnType<typeof createEhRouter>
    ui: {
      resourceJump: ReturnType<typeof createResourceJumpUI>
      getCurrentPath: () => string
    }
    db: EhDb
    container: HTMLElement
  } & ReturnType<typeof render>
> {
  const waitForFullLoad = options.waitForFullLoad ?? true
  const throwOnError = options.throwOnError ?? true

  // Set up console error/warning spies if throwOnError is enabled
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined
  let consoleWarnSpy: ReturnType<typeof vi.spyOn> | undefined
  const consoleErrors: Array<string> = []
  const consoleWarnings: Array<string> = []

  if (throwOnError) {
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation((...args) => {
        const message = args.join(' ')
        // Ignore React duplicate key warnings - these are expected in tests
        if (!message.includes('Encountered two children with the same key')) {
          consoleErrors.push(message)
        }
      })
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation((...args) => {
      const message = args.join(' ')
      // Ignore React duplicate key warnings - these are expected in tests
      if (!message.includes('Encountered two children with the same key')) {
        consoleWarnings.push(message)
      }
    })
  }

  // Clear IndexedDB to ensure fresh data is loaded
  const db = new EhDb()
  const dbMag = options.dbMagazine ?? DbMagazine.default()
  await dbMag.setup(db)
  // await db.bootstrap.clear()

  // Resolve backend instance: provided backend factory or default
  const backendInstance = options.backend ?? BackendMagazine.default()
  if (options.overrideBackendNetwork) {
    backendInstance.overrideBackendNetwork(options.overrideBackendNetwork)
  }

  backendInstance.setupNetwork(options.server)

  const trpcClient = createTRPCClient<TRPCRouter>({
    links: [httpLink({ url: 'http://localhost:9999/trpc' })],
    // transformer: { input: superjson, output: superjson },
  })

  const queryClient = createQueryClient({ trpcClient, db })
  const user = userEvent.setup()

  // Use memory history for tests to ensure isolation between tests
  const initialEntries = options.initialLink ? [options.initialLink] : ['/']
  const history = createMemoryHistory({ initialEntries })

  const router = createEhRouter({
    history,
    context: {
      queryClient,
      trpcClient,
      db,
      plugins: [],
      boostrapHealth: {
        bootstrapApiError: undefined,
      },
    },
  })

  const appComponent = (
    <App
      router={router}
      queryClient={queryClient}
      trpcClient={trpcClient}
      db={db}
    />
  )
  const result = render(appComponent)

  // Wait for full load if requested
  if (waitForFullLoad) {
    await waitFor(
      () => {
        // Check that the LoadingScreen with Spinner is no longer visible
        const spinner = result.container.querySelector(
          '[role="status"][aria-label="Loading"]',
        )
        if (spinner) {
          throw new Error('Spinner still visible - app still loading')
        }

        // Also check query states as backup
        const bootstrapState = queryClient.getQueryState(['config'])
        const resourceJumpsState = queryClient.getQueryState(['resourceJumps'])

        const bootstrapLoaded =
          bootstrapState?.status === 'success' &&
          bootstrapState.fetchStatus === 'idle'
        const resourceJumpsLoaded =
          resourceJumpsState?.status === 'success' &&
          resourceJumpsState.fetchStatus === 'idle'

        if (!bootstrapLoaded || !resourceJumpsLoaded) {
          throw new Error('Queries not yet loaded')
        }
      },
      { timeout: 10000 },
    )
  }

  // Check for console errors/warnings if throwOnError is enabled
  if (throwOnError) {
    const allErrors = [...consoleErrors, ...consoleWarnings]
    if (allErrors.length > 0) {
      const errorMessage = `Console errors/warnings detected during test:\n${allErrors.join('\n')}`
      throw new Error(errorMessage)
    }

    // Restore original console methods
    consoleErrorSpy?.mockRestore()
    consoleWarnSpy?.mockRestore()
  }

  return {
    ...result,
    user,
    queryClient,
    router,
    db,
    ui: {
      resourceJump: createResourceJumpUI(result, user),
      getCurrentPath: () => router.state.location.pathname,
    },
    container: result.container,
  }
}
