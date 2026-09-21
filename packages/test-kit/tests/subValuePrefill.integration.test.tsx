import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { createBackend, renderApp } from '../src/index'

/**
 * A legacy link's `/sub/<value>` segment has to arrive somewhere the user can
 * see it: the parameter field it belongs to, and the jump url it substitutes
 * into.
 *
 * These assert on the rendered dom for a reason. A unit test on the loader
 * passes while the page shows nothing, because the loader and the page disagree
 * about *which* parameter the value belongs to: the loader reads the slug off
 * the jump the url names, the page reads it off the whole group. The two only
 * agree when the url happens to name a jump that carries the parameter itself.
 */
describe('a legacy sub value prefills the parameter it belongs to', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  // A two-page app: the group's first page takes no parameter, its second page
  // takes `orderId`. Both link shapes below are ordinary bookmarks.
  const backend = () =>
    createBackend({
      apps: [{ slug: 'app1', resourceJumps: '2-pager' }],
      envs: [{ slug: 'dev' }, { slug: 'staging' }],
    })

  async function open(initialLink: string) {
    const rendered = await renderApp({
      server,
      backend: backend(),
      initialLink,
      throwOnError: false,
    })
    return {
      paramField: () =>
        rendered.container.querySelector<HTMLInputElement>(
          'input[name="eh-param-orderId"]',
        ),
      // The jump links are the only absolute urls on the page; the rest of the
      // anchors are in-app navigation.
      jumpHrefs: () =>
        Array.from(rendered.container.querySelectorAll('a'))
          .map((a) => a.getAttribute('href'))
          .filter(
            (href): href is string =>
              !!href?.startsWith('http://localhost:4000'),
          ),
    }
  }

  // The url names the group's first page, which takes no parameter of its own.
  // The page still offers the group's parameter field, so the value has to reach
  // it — and reach the sibling jump's url, which is what the value is for.
  test('when the url names a page that does not take the parameter itself', async () => {
    const { paramField, jumpHrefs } = await open('/env/dev/app/app1/sub/123')

    expect(jumpHrefs()).toContain(
      'http://localhost:4000/env/dev/app/app1/order/123',
    )
    expect(paramField()).not.toBeNull()
    expect(paramField()?.value).toBe('123')
  })

  // The control: the url names the page that takes the parameter. This shape has
  // always substituted, and must keep doing so.
  test('when the url names the page that takes the parameter', async () => {
    const { jumpHrefs } = await open('/env/dev/app/app1-order/sub/123')

    expect(jumpHrefs()).toContain(
      'http://localhost:4000/env/dev/app/app1/order/123',
    )
  })
})
