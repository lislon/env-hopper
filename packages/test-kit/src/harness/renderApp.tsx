import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, render, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { createTRPCClient, httpLink } from '@trpc/client'
import { vi } from 'vitest'
import {
  App,
  EhDb,
  createEhRouter,
  createQueryClient,
} from '@env-hopper/frontend-core/internal'
import { TRPC_URL } from '../mock-backend/createBackend'
import { BackendMagazine, DbMagazine } from '../mock-backend/magazines'
import { createLegacyFormUi } from '../tools/LegacyFormTools'
import { createResourceJumpUi } from '../tools/ResourceJumpTools'
import type {
  MockBackend,
  OverrideBackendNetworkFn,
} from '../mock-backend/createBackend'
import type { DbMagazineInstance } from '../mock-backend/magazines'
import type { RenderResult } from '@testing-library/react'
import type { SetupServer } from 'msw/node'
import type { TRPCRouter } from '@env-hopper/backend-core'

export interface RenderAppOptions {
  /** A listening msw server. The kit registers its tRPC handlers on it. */
  server: SetupServer
  backend?: MockBackend
  overrideBackendNetwork?: OverrideBackendNetworkFn
  initialLink?: string
  /** Return before bootstrap resolves, to observe the loading state. */
  waitForFullLoad?: boolean
  /** Fail the test on any console error or warning. Default true. */
  throwOnError?: boolean
  dbMagazine?: DbMagazineInstance
}

export interface AppHandle extends RenderResult {
  user: ReturnType<typeof userEvent.setup>
  queryClient: ReturnType<typeof createQueryClient>
  router: ReturnType<typeof createEhRouter>
  db: EhDb
  container: HTMLElement
  ui: {
    resourceJump: ReturnType<typeof createResourceJumpUi>
    /** The shipped UI: the two pickers and the widget panel beside them. */
    legacyForm: ReturnType<typeof createLegacyFormUi>
    getCurrentPath: () => string
  }
}

// The client DB outlives the render, so the setup file's afterEach has to be
// able to reach the last one and throw it away.
let activeDb: EhDb | null = null

/**
 * Empties the client DB. The setup file calls this between tests.
 *
 * Empties rather than closes or deletes it: the app writes to this DB from a
 * background cache sync that is not tied to any component, so it outlives the
 * unmount. Closing or deleting underneath that write rejects it inside dexie's
 * own promise chain — unhandled, and reported against whichever test is running
 * by then. Clearing the tables leaves the handle valid, so a late write lands
 * harmlessly instead of throwing.
 *
 * ponytail: a sync that lands *after* the clear would carry into the next test.
 * The tick below covers the ones the app actually issues; if a scenario ever
 * sees another test's cache, make the caching fetcher cancellable rather than
 * lengthening this wait.
 */
export async function cleanupTestResources(): Promise<void> {
  if (!activeDb) return
  const db = activeDb
  activeDb = null
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.all(db.tables.map((table) => table.clear()))
}

/**
 * Mounts the real `App` — real router, real client DB, real query client —
 * against a mock backend, and hands back page objects to drive it with.
 */
export async function renderApp(options: RenderAppOptions): Promise<AppHandle> {
  // A scenario can render more than once — a Background mounts the app, then a
  // deep-link step replaces it. Without this, both stay mounted and every page
  // object sees two apps' worth of DOM.
  //
  // Unmount only: the client DB deliberately survives, because it is the
  // browser's, and a scenario that re-renders to prove something was remembered
  // needs what the previous render stored. Dropping it is the job of the
  // between-tests hook in the setup file.
  cleanup()

  const waitForFullLoad = options.waitForFullLoad ?? true
  const throwOnError = options.throwOnError ?? true

  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined
  let consoleWarnSpy: ReturnType<typeof vi.spyOn> | undefined
  const consoleErrors: Array<string> = []
  const consoleWarnings: Array<string> = []

  if (throwOnError) {
    const collect =
      (into: Array<string>) =>
      (...args: Array<unknown>) => {
        const message = args.join(' ')
        // React's duplicate-key warning fires on fixtures that reuse a slug,
        // which the scenarios do on purpose.
        if (!message.includes('Encountered two children with the same key')) {
          into.push(message)
        }
      }
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(collect(consoleErrors))
    consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(collect(consoleWarnings))
  }

  const db = new EhDb()
  activeDb = db
  await (options.dbMagazine ?? DbMagazine.default()).setup(db)

  const backend = options.backend ?? BackendMagazine.default()
  if (options.overrideBackendNetwork) {
    backend.overrideBackendNetwork(options.overrideBackendNetwork)
  }
  backend.setupNetwork(options.server)

  const trpcClient = createTRPCClient<TRPCRouter>({
    links: [httpLink({ url: TRPC_URL })],
  })

  const queryClient = createQueryClient({ trpcClient, db })
  const user = userEvent.setup()

  // Memory history keeps one scenario's navigation out of the next one's.
  const history = createMemoryHistory({
    initialEntries: options.initialLink ? [options.initialLink] : ['/'],
  })

  const router = createEhRouter({
    history,
    context: {
      queryClient,
      trpcClient,
      db,
      plugins: [],
      boostrapHealth: { bootstrapApiError: undefined },
    },
  })

  const result = render(
    <App
      router={router}
      queryClient={queryClient}
      trpcClient={trpcClient}
      db={db}
    />,
  )

  if (waitForFullLoad) {
    await waitFor(
      () => {
        const spinner = result.container.querySelector(
          '[role="status"][aria-label="Loading"]',
        )
        if (spinner) {
          throw new Error('Spinner still visible - app still loading')
        }

        // The spinner leaving is the visible signal; a settled query cache is
        // the reliable one, because a route can render before its data lands.
        // Deliberately not naming the keys: the previous harness waited on a
        // `['config']` query the app had stopped using, so it waited forever.
        const queries = queryClient.getQueryCache().getAll()
        if (queries.length === 0) {
          throw new Error('No query started yet')
        }
        const inFlight = queries.filter((q) => q.state.fetchStatus !== 'idle')
        if (inFlight.length > 0) {
          throw new Error(
            `Still fetching: ${inFlight
              .map((q) => JSON.stringify(q.queryKey))
              .join(', ')}`,
          )
        }
      },
      { timeout: 10000 },
    )
  }

  if (throwOnError) {
    const allErrors = [...consoleErrors, ...consoleWarnings]
    if (allErrors.length > 0) {
      throw new Error(
        `Console errors/warnings detected during test:\n${allErrors.join('\n')}`,
      )
    }
    consoleErrorSpy?.mockRestore()
    consoleWarnSpy?.mockRestore()
  }

  return {
    ...result,
    user,
    queryClient,
    router,
    db,
    container: result.container,
    ui: {
      resourceJump: createResourceJumpUi(user),
      legacyForm: createLegacyFormUi(user),
      getCurrentPath: () => router.state.location.pathname,
    },
  }
}
