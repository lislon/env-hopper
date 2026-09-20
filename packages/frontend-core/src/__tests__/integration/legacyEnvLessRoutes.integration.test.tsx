import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import type { ResourceJumpLoaderReturn } from '~/modules/resourceJump/types'
import { createFullBackend } from './factories/simpleDSL'
import { renderApp } from './helpers/renderWithProviders'

/**
 * The url vocabulary is frozen: people have these links bookmarked and pasted
 * into tickets, so every shape the app has ever minted has to keep resolving.
 * Two of them name an app without naming an environment, which is legal — the
 * environment is simply left unselected.
 *
 * These drive the real route tree on purpose. A missing route is invisible to a
 * unit test on the url builder, which is how this gap survived: the path fell
 * through to the root `notFoundComponent`, which renders the header outside the
 * providers and throws `useAuth must be used within AuthProvider` — an error
 * that points at auth and means "no route".
 *
 * `throwOnError` is off because the session request is stubbed nowhere in this
 * harness and fails in every test of the suite, route or no route. The
 * assertions carry the weight instead: they name the matched route id, the
 * loader output, and the absence of the error page.
 */
describe('legacy links with no environment', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  // A page inside an app is written `@<page>`, because the url spells the `/` of
  // an app id as `@`. A slug carrying `@` is an ordinary link and has to survive
  // the round trip through the router untouched.
  const backend = () =>
    createFullBackend({
      apps: [
        { slug: 'app1', resourceJumps: '2-pager' },
        { slug: 'orders@shipments', resourceJumps: '2-pager' },
      ],
      envs: [{ slug: 'dev' }, { slug: 'staging' }],
    })

  async function open(initialLink: string) {
    const rendered = await renderApp({
      server,
      backend: backend(),
      initialLink,
      throwOnError: false,
    })
    const lastMatch = rendered.router.state.matches.at(-1)
    return {
      ...rendered,
      routeId: lastMatch?.routeId as string | undefined,
      loaderData: lastMatch?.loaderData as ResourceJumpLoaderReturn | undefined,
      text: rendered.container.textContent,
    }
  }

  test.each([
    ['a plain slug', '/app/app1', 'app1', 'App1'],
    [
      'a slug carrying a page suffix',
      '/app/orders@shipments',
      'orders@shipments',
      'Orders@Shipments',
    ],
  ])(
    '%s resolves to the app route and preselects the app',
    async (_name, initialLink, slug, displayName) => {
      const { routeId, loaderData, text, ui } = await open(initialLink)

      expect(routeId).toBe('/_layout/app/$appSlug/')
      // The url is left exactly as the bookmark spelled it, `@` included. No
      // environment is guessed at and the url is not rewritten: doing either
      // would silently retarget a link someone else is about to open.
      expect(ui.getCurrentPath()).toBe(initialLink)
      expect(loaderData?.resourceSlug).toBe(slug)
      expect(loaderData?.envSlug).toBeUndefined()

      expect(text).toContain(displayName)
      expect(text).not.toContain('Ooops!')
    },
  )

  // The last row is the environment-ful route, unchanged, as the control: the
  // sub value has to reach the same named parameter whether or not the url
  // carries an environment.
  test.each([
    [
      'a plain slug',
      '/app/app1-order/sub/123',
      '/_layout/app/$appSlug/sub/$subValue/',
      undefined,
    ],
    [
      'a slug carrying a page suffix',
      '/app/orders@shipments-order/sub/123',
      '/_layout/app/$appSlug/sub/$subValue/',
      undefined,
    ],
    [
      'the environment-ful shape, for comparison',
      '/env/dev/app/app1-order/sub/123',
      '/_layout/env/$envSlug/app/$appSlug/sub/$subValue/',
      'dev',
    ],
  ])(
    '%s carries the sub value into the late-resolvable parameter',
    async (_name, initialLink, expectedRouteId, expectedEnvSlug) => {
      const { routeId, loaderData, text, ui } = await open(initialLink)

      expect(routeId).toBe(expectedRouteId)
      expect(ui.getCurrentPath()).toBe(initialLink)
      expect(loaderData?.envSlug).toBe(expectedEnvSlug)
      expect(loaderData?.subValue).toBe('123')
      // Named, not merely carried: a value stored under any other key resolves
      // nothing when the jump url is substituted.
      expect(loaderData?.crossCuttingParams).toEqual([
        { slug: 'orderId', stringValue: '123' },
      ])

      expect(text).not.toContain('Ooops!')
    },
  )
})
