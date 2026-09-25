/**
 * Infrastructure-level checks on the harness itself: that a deep link resolves,
 * that the client DB caches what it should, and that a cached app survives the
 * backend going away. Behaviour belongs in the .feature files next door; these
 * assert the plumbing those scenarios stand on, in terms too mechanical to read
 * well as prose.
 */
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'
import { dbCacheDbKeys } from '@env-hopper/frontend-core/internal'
import { setUiSkin } from '@env-hopper/frontend-core'
import { renderApp } from '../src/index'

describe('harness', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  /*
   * These read the replacement UI's page objects — one of them the breadcrumb
   * trail, which the ported UI has no equivalent for — so they name that UI
   * rather than riding whichever skin is currently the default.
   */
  beforeEach(() => setUiSkin('modern'))

  test('a deep link resolves the env into the jump url', async () => {
    const { ui } = await renderApp({
      server,
      initialLink: '/env/dev/app/app1',
    })

    expect(ui.resourceJump.jumps.getUrl('App1')).toBe(
      'http://localhost:4000/env/dev/app/app1',
    )
  })

  test('a deep link is not rewritten on load', async () => {
    const { ui } = await renderApp({
      server,
      initialLink: '/env/dev/app/app1',
    })

    expect(ui.getCurrentPath()).toBe('/env/dev/app/app1')
    expect(ui.resourceJump.breadcrumb.getTrail()).toEqual(
      expect.arrayContaining(['Dev', 'App1']),
    )
  })

  test('resourceJumps are cached to IndexedDB after fetch', async () => {
    const { db } = await renderApp({ server })

    const cached = await db.resourceJumps.get(dbCacheDbKeys.ResourceJumps)

    expect(cached?.resourceJumps[0]?.slug).toBe('app1')
  })

  test('the app still loads from that cache when the backend is gone', async () => {
    const { db } = await renderApp({ server })
    expect(
      await db.resourceJumps.get(dbCacheDbKeys.ResourceJumps),
    ).toBeDefined()

    server.resetHandlers()

    const { ui } = await renderApp({
      server,
      initialLink: '/env/dev/app/app1',
      // The failing fetch logs, and the point of the test is that it recovers.
      throwOnError: false,
      overrideBackendNetwork: (srv, mswTrpc, backendData) => {
        srv.use(
          mswTrpc.bootstrap.query(() => backendData.bootstrap),
          mswTrpc.resourceJumps.query(() => {
            throw new Error('Network request failed')
          }),
        )
      },
    })

    expect(ui.getCurrentPath()).toBe('/env/dev/app/app1')
  })
})
