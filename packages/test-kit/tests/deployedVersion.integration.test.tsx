/**
 * The deployed-version line under the jump card, mounted in the real App
 * through a deep link, as a person opening a bookmark sees it.
 */
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { waitFor } from '@testing-library/react'
import { createBackend, renderApp } from '../src/index'
import type { FixtureDeployments } from '../src/index'

type Row = FixtureDeployments['rows'][number]

// jsdom ships no modal dialog: open and close by attribute, as the browser
// would, so the details are reachable in the accessibility tree.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

const row = (over: Partial<Row>): Row => ({
  env: 'staging',
  componentSlug: 'shop-ui',
  targetSlug: 'k8s:staging/shop',
  version: 'main-41',
  aliases: [],
  buildUrl: 'https://ci.example.com/pipelines/41',
  deployedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
  deployedBy: 'jdoe',
  deployUrl: 'https://ci.example.com/pipelines/42',
  source: 'ci',
  ...over,
})
const users = { jdoe: { firstName: 'Jo', lastName: 'Doe' } }

const backend = (deployments: Record<string, FixtureDeployments>) =>
  createBackend({
    apps: [
      { slug: 'shop', resourceJumps: '1-pager' },
      { slug: 'wiki', resourceJumps: '1-pager' },
    ],
    envs: [{ slug: 'dev' }, { slug: 'staging' }],
    deployments,
  })

const shopUi = { slug: 'shop-ui', displayName: 'UI', lead: true as const }
const shopApi = { slug: 'shop-api', displayName: 'API' }
const down = {
  state: 'down' as const,
  checker: 'http',
  observedAt: new Date().toISOString(),
  detail: '503',
}
const shopTwoComponents = (lead: Partial<Row> = {}): FixtureDeployments => ({
  components: [shopApi, shopUi],
  users,
  rows: [
    row(lead),
    row({ componentSlug: 'shop-api', version: 'main-9', health: down }),
  ],
})

describe('deployed version under the jump card', () => {
  const server = setupServer()
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  const open = (
    link: string,
    deployments: Record<string, FixtureDeployments>,
  ) => renderApp({ server, backend: backend(deployments), initialLink: link })

  const lines = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-testid="deployed-version"]',
      ),
    )

  test('a healthy deploy shows its Version and time, with no dot', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: { components: [shopUi], users, rows: [row({})] },
    })
    await waitFor(() => expect(lines(app.container)).toHaveLength(1))
    const [line] = lines(app.container)
    expect(line!.querySelector('button')).toHaveTextContent('main-41')
    expect(line!.querySelector('.eh-deployed-dot')).toBeNull()
    expect(line!.querySelector('.eh-deployed-star')).toBeNull()
    expect(line!.textContent).toContain('15 min ago')
    expect(line!.querySelector('[role="tooltip"]')?.textContent).toContain(
      'by Jo Doe · via ci',
    )
  })

  test("several Components: one line with the lead's Version, a star for a sibling's other Version, the worst dot", async () => {
    const app = await open('/env/staging/app/shop', {
      shop: shopTwoComponents(),
    })
    await waitFor(() => expect(lines(app.container)).toHaveLength(1))
    const [line] = lines(app.container)
    expect(line!.querySelector('button')).toHaveTextContent('main-41')
    expect(line!.querySelector('.eh-deployed-star')).toHaveAttribute(
      'title',
      'API runs main-9',
    )
    expect(line!.querySelector('.eh-deployed-dot-down')).not.toBeNull()
  })

  test('clicking the Version opens the details, one row per Component, and closing returns focus', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: shopTwoComponents({
        endpoints: [{ kind: 'ui', url: 'https://shop.example.com' }],
      }),
    })
    await waitFor(() => expect(lines(app.container)).toHaveLength(1))
    const opener = lines(app.container)[0]!.querySelector('button')!
    await app.user.click(opener)
    const dialog = app.container.querySelector('dialog')!
    expect(dialog).toHaveAttribute('open')
    const rows = Array.from(
      dialog.querySelectorAll('[data-testid="deployed-component"]'),
    ).map((r) => r.textContent)
    expect(rows[0]).toContain('API')
    expect(rows[0]).toContain('down · http: 503')
    expect(rows[1]).toContain('UIlead')
    expect(
      Array.from(dialog.querySelectorAll('a')).map((a) => a.textContent),
    ).toEqual([
      'build pipeline',
      'deploy job',
      'build pipeline',
      'deploy job',
      'ui',
    ])
    await app.user.click(dialog.querySelector('button[aria-label="Close"]')!)
    expect(dialog).not.toHaveAttribute('open')
    expect(document.activeElement).toBe(opener)
  })

  test('the lead not deployed on this Environment says so, with a grey dot', async () => {
    const app = await open('/env/dev/app/shop', {
      shop: { components: [shopUi], users, rows: [row({})] },
    })
    await waitFor(() => expect(lines(app.container)).toHaveLength(1))
    const [line] = lines(app.container)
    expect(line).toHaveTextContent('not deployed')
    expect(line!.querySelector('.eh-deployed-dot-not-deployed')).not.toBeNull()
  })

  test('an App the catalog does not know renders nothing', async () => {
    const app = await open('/env/staging/app/wiki', {})
    expect(app.container.querySelector('#jump-main-button')).not.toBeNull()
    // Give the query time to answer before asserting absence.
    await new Promise((r) => setTimeout(r, 50))
    expect(lines(app.container)).toHaveLength(0)
  })

  describe('pair details from the preloaded slices', () => {
    /** The tRPC requests the app sent, by path, in order. */
    function trpcRequests() {
      const paths: Array<string> = []
      server.events.on('request:start', ({ request }) => {
        const url = new URL(request.url)
        if (url.pathname.includes('/trpc/')) {
          paths.push(url.pathname.split('/').at(-1)!)
        }
      })
      return paths
    }
    const streamed = (paths: Array<string>) =>
      paths.filter((p) => /^(pair|slices)(,|$)/.test(p))
    const shopOnBoth = () => ({
      shop: {
        components: [shopUi],
        users,
        rows: [row({}), row({ env: 'dev', version: 'main-40' })],
      },
    })

    test('a deep link starts bootstrap, its pair and the slices before anything renders; switching to a loaded Environment sends nothing', async () => {
      localStorage.setItem(
        'recent',
        JSON.stringify([{ app: 'wiki', env: 'dev', url: 'https://w' }]),
      )
      const sent = trpcRequests()
      const app = await open('/env/staging/app/shop', shopOnBoth())
      // The first requests of all, together, before the router asks for jumps.
      await waitFor(() => expect(sent.length).toBeGreaterThanOrEqual(2))
      expect(sent.slice(0, 2).sort()).toEqual(['bootstrap', 'pair,slices'])
      await waitFor(() => expect(lines(app.container)).toHaveLength(1))
      expect(
        lines(app.container)[0]!.querySelector('button'),
      ).toHaveTextContent('main-41')
      // Every facet of a pair in the slices is cached on its own key.
      await waitFor(() =>
        expect(
          app.queryClient.getQueryData(['pair', 'shop', 'dev', 'deployment']),
        ).toBeDefined(),
      )
      const before = streamed(sent).length

      await app.ui.legacyForm.pickEnvironment('Dev')
      await waitFor(() =>
        expect(
          lines(app.container)[0]!.querySelector('button'),
        ).toHaveTextContent('main-40'),
      )
      await new Promise((r) => setTimeout(r, 50))
      expect(streamed(sent).slice(before)).toEqual([])
    })

    test('a pair from a slice names its deployer by username until `users` answers with the profile', async () => {
      localStorage.setItem(
        'recent',
        JSON.stringify([{ app: 'shop', env: 'dev', url: 'https://w' }]),
      )
      const sent = trpcRequests()
      const shop = backend(shopOnBoth())
      // Hold the profile back, behind the kit's own handlers.
      const setupNetwork = shop.setupNetwork
      shop.setupNetwork = (s) => {
        setupNetwork(s)
        s.use(
          http.get(/\/users(\?|$)/, async () => {
            await new Promise((r) => setTimeout(r, 300))
          }),
        )
      }
      const app = await renderApp({
        server,
        backend: shop,
        initialLink: '/env/staging/app/shop',
      })
      const tip = () =>
        lines(app.container)[0]!.querySelector('[role="tooltip"]')!.textContent
      // The open pair came by `pair`, with its deployer's profile.
      await waitFor(() => expect(tip()).toContain('by Jo Doe'))
      app.queryClient.removeQueries({ queryKey: ['user'] })
      await app.ui.legacyForm.pickEnvironment('Dev')
      await waitFor(() =>
        expect(
          lines(app.container)[0]!.querySelector('button'),
        ).toHaveTextContent('main-40'),
      )
      expect(tip()).toContain('by jdoe')
      await waitFor(() => expect(tip()).toContain('by Jo Doe'), {
        timeout: 2000,
      })
      expect(sent.filter((p) => p === 'users')).toHaveLength(1)
    })

    test('the details ask `users` once for all the deployers whose profiles are missing', async () => {
      localStorage.setItem(
        'recent',
        JSON.stringify([{ app: 'shop', env: 'dev', url: 'https://w' }]),
      )
      const asked: Array<Array<string>> = []
      server.events.on('request:start', ({ request }) => {
        const url = new URL(request.url)
        if (/\/users$/.test(url.pathname)) {
          asked.push(
            (
              JSON.parse(url.searchParams.get('input')!) as {
                usernames: Array<string>
              }
            ).usernames,
          )
        }
      })
      const shopWorker = { slug: 'shop-worker', displayName: 'Worker' }
      const app = await open('/env/staging/app/shop', {
        shop: {
          components: [shopApi, shopUi, shopWorker],
          users: { ...users, asmith: { firstName: 'Al', lastName: 'Smith' } },
          rows: [
            row({}),
            // On dev the lead names nobody, so the line asks for no one.
            row({ env: 'dev', version: 'main-40', deployedBy: undefined }),
            row({ env: 'dev', componentSlug: 'shop-api', version: 'main-9' }),
            row({
              env: 'dev',
              componentSlug: 'shop-worker',
              version: 'main-3',
              deployedBy: 'asmith',
            }),
          ],
        },
      })
      await waitFor(() => expect(lines(app.container)).toHaveLength(1))
      app.queryClient.removeQueries({ queryKey: ['user'] })
      await app.ui.legacyForm.pickEnvironment('Dev')
      await waitFor(() =>
        expect(
          lines(app.container)[0]!.querySelector('button'),
        ).toHaveTextContent('main-40'),
      )
      expect(asked).toEqual([])
      await app.user.click(lines(app.container)[0]!.querySelector('button')!)
      const dialog = app.container.querySelector('dialog')!
      await waitFor(() => expect(dialog).toHaveTextContent('Al Smith'))
      expect(dialog).toHaveTextContent('Jo Doe')
      expect(asked.map((names) => [...names].sort())).toEqual([
        ['asmith', 'jdoe'],
      ])
    })

    test('slices that arrive after a pair never overwrite it', async () => {
      const HOLD_MS = 1500
      localStorage.setItem(
        'recent',
        JSON.stringify([{ app: 'shop', env: 'dev', url: 'https://w' }]),
      )
      const sent = trpcRequests()
      const deployments = shopOnBoth()
      const shop = backend(deployments)
      // Hold the first pair and its slices back, behind the kit's own
      // handlers; the handler behind this one then answers.
      const setupNetwork = shop.setupNetwork
      shop.setupNetwork = (s) => {
        setupNetwork(s)
        s.use(
          http.get(/\/pair,slices(\?|$)/, async () => {
            await new Promise((r) => setTimeout(r, HOLD_MS))
          }),
        )
      }
      const app = await renderApp({
        server,
        backend: shop,
        initialLink: '/env/staging/app/shop',
        // The held-back pair would keep a full load waiting.
        waitForFullLoad: false,
      })
      await waitFor(() =>
        expect(app.container.querySelector('#jump-main-button')).not.toBeNull(),
      )
      await app.ui.legacyForm.pickEnvironment('Dev')
      await waitFor(() => expect(streamed(sent)).toContain('pair'))
      const key = ['pair', 'shop', 'dev', 'deployment']
      await waitFor(() =>
        expect(app.queryClient.getQueryData(key)).toBeDefined(),
      )
      const fromPair = app.queryClient.getQueryData(key)
      // What the slices answer with later differs, so an overwrite shows.
      deployments.shop.rows[1]!.version = 'main-39'
      // The held-back slices, which hold shop on dev too, land after it.
      await waitFor(
        () =>
          expect(
            app.queryClient.getQueryData(['pair', 'wiki', 'dev', 'deployment']),
          ).toBeDefined(),
        { timeout: HOLD_MS * 2 },
      )
      expect(app.queryClient.getQueryData(key)).toEqual(fromPair)
      expect(
        lines(app.container)[0]!.querySelector('button'),
      ).toHaveTextContent('main-40')
    })

    test('the slices leave out the open pair, which `pair` loads', async () => {
      const sent = trpcRequests()
      const app = await open('/env/staging/app/shop', shopOnBoth())
      await waitFor(() => expect(lines(app.container)).toHaveLength(1))
      expect(streamed(sent)).toEqual(['pair,slices'])
    })
  })
})
