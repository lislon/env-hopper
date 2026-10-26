/**
 * The deployed-version line under the jump card, mounted in the real App
 * through a deep link, as a person opening a bookmark sees it.
 */
import { http } from 'msw'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
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
    ui: { workItemUrl: 'https://issues.example.com/browse/{{key}}' },
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
      'Not every component of this app runs this version:\nAPI runs main-9',
    )
    expect(line!.querySelector('.eh-deployed-dot-down')).not.toBeNull()
  })

  /** Opens the details from the line; the dialog, and a cell by row label and Component. */
  const openDetails = async (app: Awaited<ReturnType<typeof open>>) => {
    await waitFor(() => expect(lines(app.container)).toHaveLength(1))
    const opener = lines(app.container)[0]!.querySelector('button')!
    await app.user.click(opener)
    const dialog = app.container.querySelector('dialog')!
    expect(dialog).toHaveAttribute('open')
    const rowLabels = Array.from(
      dialog.querySelectorAll('tbody th[scope="row"]'),
    ).map((th) => th.textContent)
    const cell = (label: string, component: string) => {
      const tr = Array.from(dialog.querySelectorAll('tbody tr')).find(
        (r) => r.querySelector('th')?.textContent === label,
      )!
      return tr.querySelector<HTMLElement>(`[data-component="${component}"]`)!
    }
    const columns = Array.from(
      dialog.querySelectorAll('thead th[scope="col"]'),
    ).map((th) => th.getAttribute('data-component'))
    return { opener, dialog, rowLabels, cell, columns }
  }
  const links = (el: Element) =>
    Array.from(el.querySelectorAll('a')).map((a) => [
      a.textContent,
      a.getAttribute('href'),
    ])
  const FIELD_ORDER = [
    'Version',
    'Aliases',
    'Health',
    'Deployed',
    'By',
    'Read from',
    'Where',
    'URL',
    'Pipeline',
    'Deploy job',
    'Commit',
    'Change request',
  ]

  test('one Component: the same fields as rows, in one value column, with no main tag and no group header', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: {
        components: [shopUi],
        users,
        rows: [row({ cluster: 'qa-1', namespace: 'shop', aliases: ['v1.4'] })],
      },
    })
    const { dialog, rowLabels, cell, columns } = await openDetails(app)
    expect(rowLabels).toEqual(FIELD_ORDER)
    expect(columns).toEqual(['shop-ui'])
    expect(dialog.querySelector('.eh-deployed-lead')).toBeNull()
    expect(dialog.querySelector('.eh-deployed-group-header')).toBeNull()
    expect(links(cell('Version', 'shop-ui'))).toEqual([
      ['main-41', 'https://ci.example.com/pipelines/41'],
    ])
    expect(cell('Aliases', 'shop-ui')).toHaveTextContent('v1.4')
    expect(cell('Health', 'shop-ui')).toHaveTextContent('n/a')
    expect(cell('Deployed', 'shop-ui')).toHaveTextContent('15 min ago')
    expect(cell('Deployed', 'shop-ui').firstElementChild).toHaveAttribute(
      'title',
    )
    expect(cell('By', 'shop-ui')).toHaveTextContent('Jo Doe')
    expect(cell('Where', 'shop-ui')).toHaveTextContent('qa-1/shop')
    expect(cell('Commit', 'shop-ui')).toHaveTextContent('n/a')
    expect(cell('Change request', 'shop-ui')).toHaveTextContent('n/a')
  })

  describe('the change request of a Version', () => {
    const basket = {
      id: '14',
      url: 'https://git.example.com/shop/-/merge_requests/14',
      title: 'Add the basket',
      workItems: ['SHOP-7', 'SHOP-9'],
      direct: true,
    }
    const text = (el: Element) => el.textContent.replace(/\s+/g, ' ').trim()

    test('its Work Items link to their pages and its title to it; no description is asked for', async () => {
      const asked: Array<string> = []
      const record = ({ request }: { request: Request }) => {
        if (request.url.includes('changeRequestDetails'))
          asked.push(request.url)
      }
      server.events.on('request:start', record)
      try {
        const app = await open('/env/staging/app/shop', {
          shop: {
            components: [shopUi],
            users,
            rows: [row({ changeRequest: basket })],
          },
        })
        const { cell } = await openDetails(app)
        const crCell = cell('Change request', 'shop-ui')

        expect({
          asked: asked.length,
          links: links(crCell),
          text: text(crCell),
        }).toEqual({
          asked: 0,
          links: [
            ['SHOP-7', 'https://issues.example.com/browse/SHOP-7'],
            ['SHOP-9', 'https://issues.example.com/browse/SHOP-9'],
            ['Add the basket', basket.url],
          ],
          text: 'SHOP-7 SHOP-9 Add the basket',
        })
      } finally {
        server.events.removeListener('request:start', record)
      }
    })

    test('a title that starts with its Work Item says the key once', async () => {
      const app = await open('/env/staging/app/shop', {
        shop: {
          components: [shopUi],
          users,
          rows: [
            row({
              changeRequest: {
                ...basket,
                title: 'SHOP-7: Add the basket',
                workItems: ['SHOP-7'],
              },
            }),
          ],
        },
      })
      const { cell } = await openDetails(app)

      expect(text(cell('Change request', 'shop-ui'))).toBe(
        'SHOP-7 Add the basket',
      )
    })

    test('a build of the branch it merged into says "merged via"', async () => {
      const app = await open('/env/staging/app/shop', {
        shop: {
          components: [shopUi],
          users,
          rows: [
            row({
              changeRequest: {
                id: '12',
                url: 'https://git.example.com/shop/-/merge_requests/12',
                title: 'Fix totals',
                direct: false,
              },
            }),
          ],
        },
      })

      const { cell } = await openDetails(app)

      expect(text(cell('Change request', 'shop-ui'))).toBe(
        'merged via Fix totals',
      )
    })
  })

  test('two Components with different Versions: group header with app name and count, bracket, the lead first with a main tag and its hint, the other Version highlighted, closing returns focus', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: {
        ...shopTwoComponents({ commitSha: '0123456789abcdef' }),
        components: [
          shopApi,
          { ...shopUi, commitUrl: 'https://git.example.com/-/commit/{{sha}}' },
        ],
      },
    })
    const { opener, dialog, cell, columns } = await openDetails(app)
    expect(columns).toEqual(['shop-ui', 'shop-api'])
    const groupHeader = dialog.querySelector('.eh-deployed-group-header')!
    expect(groupHeader).not.toBeNull()
    expect(
      groupHeader.querySelector('.eh-deployed-app-name'),
    ).toHaveTextContent('Shop')
    expect(
      groupHeader.querySelector('.eh-deployed-component-count'),
    ).toHaveTextContent('2 components')
    expect(groupHeader.querySelector('.eh-deployed-bracket')).not.toBeNull()
    const tag = dialog.querySelector<HTMLElement>(
      'thead [data-component="shop-ui"] .eh-deployed-lead',
    )!
    expect(tag).toHaveTextContent('main')
    expect(tag.tabIndex).toBe(0)
    const hint = document.getElementById(tag.getAttribute('aria-describedby')!)
    expect(hint).toHaveAttribute('role', 'tooltip')
    expect(hint).toHaveClass('eh-deployed-tip')
    expect(hint).toHaveTextContent(
      'Main component: its version is the one shown on the line under the card. A * there means another component runs a different version.',
    )
    expect(cell('Version', 'shop-api')).toHaveClass('eh-deployed-differs')
    expect(cell('Version', 'shop-ui')).not.toHaveClass('eh-deployed-differs')
    expect(cell('Health', 'shop-api')).toHaveTextContent('down · 503')
    expect(links(cell('Pipeline', 'shop-ui'))).toEqual([
      ['#41', 'https://ci.example.com/pipelines/41'],
    ])
    expect(links(cell('Deploy job', 'shop-ui'))).toEqual([
      ['#42', 'https://ci.example.com/pipelines/42'],
    ])
    expect(links(cell('Commit', 'shop-ui'))).toEqual([
      ['0123456', 'https://git.example.com/-/commit/0123456789abcdef'],
    ])
    // A commit with no Component commit page: no commit at all here.
    expect(cell('Commit', 'shop-api')).toHaveTextContent('n/a')
    await app.user.click(dialog.querySelector('button[aria-label="Close"]')!)
    expect(dialog).not.toHaveAttribute('open')
    expect(document.activeElement).toBe(opener)
  })

  test('six Components: group header with app name and count, bracket present', async () => {
    const components = [
      shopUi,
      shopApi,
      { slug: 'shop-worker', displayName: 'Worker' },
      { slug: 'shop-cache', displayName: 'Cache' },
      { slug: 'shop-db', displayName: 'DB' },
      { slug: 'shop-queue', displayName: 'Queue' },
    ]
    const app = await open('/env/staging/app/shop', {
      shop: {
        components,
        users,
        rows: components.map((c) => row({ componentSlug: c.slug })),
      },
    })
    const { dialog } = await openDetails(app)
    const groupHeader = dialog.querySelector('.eh-deployed-group-header')!
    expect(groupHeader).not.toBeNull()
    expect(
      groupHeader.querySelector('.eh-deployed-app-name'),
    ).toHaveTextContent('Shop')
    expect(
      groupHeader.querySelector('.eh-deployed-component-count'),
    ).toHaveTextContent('6 components')
    expect(groupHeader.querySelector('.eh-deployed-bracket')).not.toBeNull()
  })

  test('a Component not deployed here says so in its Version cell, with a dash below', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: { components: [shopApi, shopUi], users, rows: [row({})] },
    })
    const { cell } = await openDetails(app)
    expect(cell('Version', 'shop-api')).toHaveTextContent('not deployed')
    for (const label of FIELD_ORDER.slice(1)) {
      expect(cell(label, 'shop-api')).toHaveTextContent('—')
    }
    expect(cell('Version', 'shop-ui')).toHaveTextContent('main-41')
  })

  test('URL: each Endpoint by its host, at most two then +N, n/a when none', async () => {
    const worker = { slug: 'shop-worker', displayName: 'Worker' }
    const ep = (host: string) => ({
      kind: 'ui' as const,
      url: `https://${host}/`,
    })
    const app = await open('/env/staging/app/shop', {
      shop: {
        components: [shopUi, shopApi, worker],
        users,
        rows: [
          row({ endpoints: [ep('shop.example.com')] }),
          row({ componentSlug: 'shop-api' }),
          row({
            componentSlug: 'shop-worker',
            endpoints: [
              ep('a.example.com'),
              ep('b.example.com'),
              ep('c.example.com'),
            ],
          }),
        ],
      },
    })
    const { cell } = await openDetails(app)
    expect(links(cell('URL', 'shop-ui'))).toEqual([
      ['shop.example.com', 'https://shop.example.com/'],
    ])
    expect(cell('URL', 'shop-api')).toHaveTextContent('n/a')
    expect(links(cell('URL', 'shop-worker'))).toEqual([
      ['a.example.com', 'https://a.example.com/'],
      ['b.example.com', 'https://b.example.com/'],
    ])
    expect(cell('URL', 'shop-worker')).toHaveTextContent('+1')
  })

  test('the lead not deployed on this Environment says so, with no dot: not deployed is no problem', async () => {
    const app = await open('/env/dev/app/shop', {
      shop: { components: [shopUi], users, rows: [row({})] },
    })
    await waitFor(() => expect(lines(app.container)).toHaveLength(1))
    const [line] = lines(app.container)
    expect(line).toHaveTextContent('not deployed')
    expect(line!.querySelector('.eh-deployed-dot')).toBeNull()
  })

  describe('a Deploy Attempt beside the Version', () => {
    const minAgo = (m: number) =>
      new Date(Date.now() - m * 60_000).toISOString()
    const withAttempt = (attempt: NonNullable<Row['attempt']>) => ({
      shop: {
        components: [
          { ...shopUi, commitUrl: 'https://git.example.com/-/commit/{{sha}}' },
        ],
        users: { ...users, ann: { firstName: 'Ann' } },
        rows: [row({ commitSha: '0123456789abcdef', attempt })],
      },
    })
    const failed = () => ({
      changeRequest: {
        id: '15',
        url: 'https://git.example.com/shop/-/merge_requests/15',
        title: 'Faster checkout',
        workItems: ['SHOP-11'],
        direct: true,
      },
      version: 'main-42',
      status: 'failed' as const,
      startedAt: minAgo(11),
      endedAt: minAgo(5),
      by: 'ann',
      targetSlug: 'k8s:staging/shop',
      buildUrl: 'https://ci.example.com/pipelines/43',
      deployUrl: 'https://ci.example.com/pipelines/44',
      jobUrl: 'https://ci.example.com/jobs/45',
      commitSha: 'fedcba9876543210',
      ref: 'main',
    })
    /** What the line shows, as one string: its tooltip is not on screen. */
    const lineText = async (container: HTMLElement) => {
      await waitFor(() => expect(lines(container)).toHaveLength(1))
      const line = lines(container)[0]!.cloneNode(true) as HTMLElement
      line.querySelectorAll('[role="tooltip"]').forEach((t) => t.remove())
      return line.textContent.replace(/\s+/g, ' ').trim()
    }
    /** The attempt's own line under the Version's. */
    const attemptText = (container: HTMLElement) =>
      Array.from(
        container.querySelector('.eh-deployed-attempt')?.children ?? [],
      )
        .map((part) => part.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(' ')

    test('a running attempt has a line of its own under the Version', async () => {
      const app = await open(
        '/env/staging/app/shop',
        withAttempt({
          version: 'main-42',
          status: 'running',
          startedAt: minAgo(1),
          targetSlug: 'k8s:staging/shop',
        }),
      )

      expect({
        line: await lineText(app.container),
        attempt: attemptText(app.container),
      }).toEqual({
        line: 'main-41 · deployed 15 min ago by Jo Doe',
        attempt: 'New deployment main-42 is running · started 1 min ago',
      })
    })

    test("a failed attempt's time moves with the Version's, on one clock", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const app = await open('/env/staging/app/shop', withAttempt(failed()))
        const seen = async () =>
          `${await lineText(app.container)} | ${attemptText(app.container)}`
        const before = await seen()

        await vi.advanceTimersByTimeAsync(60_000)

        expect({ before, after: await seen() }).toEqual({
          before:
            'main-41 · deployed 15 min ago by Jo Doe | ✕ New deployment main-42 failed 5 min ago · started by Ann job #45 ↗',
          after:
            'main-41 · deployed 16 min ago by Jo Doe | ✕ New deployment main-42 failed 6 min ago · started by Ann job #45 ↗',
        })
      } finally {
        vi.useRealTimers()
      }
    })

    test('the attempt line opens the attempt beside the current stable Version', async () => {
      const app = await open('/env/staging/app/shop', withAttempt(failed()))
      await waitFor(() => expect(lines(app.container)).toHaveLength(1))

      await app.user.click(
        app.container.querySelector('.eh-deployed-attempt-text')!,
      )

      const dialog = app.container.querySelector<HTMLElement>(
        'dialog.eh-deployed-attempt-dialog',
      )!
      expect(dialog).toHaveAttribute('open')
      await waitFor(() =>
        expect(
          dialog.querySelector('.eh-deployed-cr [role="status"]'),
        ).toBeNull(),
      )
      const table = Array.from(dialog.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.children).map((c) =>
          c.textContent.replace(/\s+/g, ' ').trim(),
        ),
      )
      expect({
        table,
        jobErrors: dialog.querySelector('footer button')?.matches(':disabled'),
      }).toEqual({
        table: [
          ['', 'Failed attempt', 'Current stable'],
          ['Version', 'main-42', 'main-41'],
          ['Status', 'failed', 'deployed'],
          ['Started', expect.stringMatching(/\d/), 'n/a'],
          [
            'Ended · Duration',
            expect.stringMatching(/ · 6 min$/),
            expect.stringMatching(/\d/),
          ],
          ['By', 'Ann', 'Jo Doe'],
          ['Where', 'k8s:staging/shop', 'k8s:staging/shop'],
          ['Pipeline', '#43', '#41'],
          ['Deploy job', '#45', '#42'],
          ['Commit', 'fedcba9', '0123456'],
          ['Change request', 'SHOP-11 Faster checkout', 'n/a'],
        ],
        jobErrors: true,
      })
    })
  })

  describe('the slot under the card is never empty', () => {
    const slot = (container: HTMLElement) =>
      container.querySelector<HTMLElement>(
        '[data-testid="deployed-version-slot"]',
      )
    /** The kit's bootstrap, with `pair` answered by `pair` instead. */
    const openWithPair = (
      pair: Parameters<typeof http.get>[1],
      waitForFullLoad = true,
    ) =>
      renderApp({
        server,
        backend: backend({
          shop: { components: [shopUi], users, rows: [row({})] },
        }),
        initialLink: '/env/staging/app/shop',
        throwOnError: false,
        waitForFullLoad,
        overrideBackendNetwork: (srv, mswTrpc, data) => {
          srv.use(
            mswTrpc.bootstrap.query(() => data.bootstrap),
            mswTrpc.resourceJumps.query(() => data.resourceJumps),
            http.get(/\/trpc\/[^?]*\bpair\b/, pair),
          )
        },
      })
    const errorTip = (container: HTMLElement) =>
      slot(container)?.querySelector('[role="tooltip"]')?.textContent

    test('an App the catalog does not know, or one with no Components, says no version info', async () => {
      const app = await open('/env/staging/app/wiki', {
        shop: { components: [], rows: [] },
      })
      await waitFor(() =>
        expect(slot(app.container)).toHaveTextContent('no version info'),
      )
      app.unmount()
      const shop = await open('/env/staging/app/shop', {
        shop: { components: [], rows: [] },
      })
      await waitFor(() =>
        expect(slot(shop.container)).toHaveTextContent('no version info'),
      )
    })

    test('a page whose URL still needs a value has the slot too', async () => {
      const app = await renderApp({
        server,
        backend: createBackend({
          apps: [{ slug: 'shop', resourceJumps: '2-pager' }],
          envs: [{ slug: 'staging' }],
          deployments: {},
        }),
        initialLink: '/env/staging/app/shop-order',
      })
      expect(app.container.querySelector('#jump-main-button')).toBeNull()
      await waitFor(() =>
        expect(slot(app.container)).toHaveTextContent('no version info'),
      )
    })

    test('a failing deployment source shows the error label, keyboard-focusable, with what failed', async () => {
      const app = await renderApp({
        server,
        backend: backend({
          shop: {
            components: [shopUi],
            get rows(): Array<Row> {
              throw new Error('catalog down')
            },
          },
        }),
        initialLink: '/env/staging/app/shop',
        throwOnError: false,
        waitForFullLoad: false,
      })
      await waitFor(() =>
        expect(slot(app.container)).toHaveTextContent('⚠ version unavailable'),
      )
      const label = slot(app.container)!.querySelector<HTMLElement>(
        '.eh-deployed-error',
      )!
      expect(label.tabIndex).toBe(0)
      expect(errorTip(app.container)).toContain(
        '`pair` failed: the deployment source failed',
      )
      expect(errorTip(app.container)).toContain('retrying')
    })

    test('an unreachable backend shows the error label with the message, then the Version once it answers', async () => {
      let calls = 0
      const app = await openWithPair(() => {
        calls++
        // The next attempts fall through to the kit's real router.
        return calls === 1 ? Response.error() : undefined
      }, false)
      await waitFor(() =>
        expect(errorTip(app.container)).toMatch(
          /^`pair` failed: \S.*retrying · 1 failed attempt$/,
        ),
      )
      await waitFor(
        () =>
          expect(
            lines(app.container)[0]?.querySelector('button'),
          ).toHaveTextContent('main-41'),
        { timeout: 3000 },
      )
    })

    test('a stream that never answers shows the placeholder, then the error label at the timeout', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        const app = await openWithPair(
          () => new Promise<never>(() => {}),
          false,
        )
        await waitFor(() =>
          expect(
            slot(app.container)?.querySelector('[role="status"]'),
          ).not.toBeNull(),
        )
        // frontend-core's PAIR_FACET_TIMEOUT_MS
        await vi.advanceTimersByTimeAsync(10_000)
        await waitFor(() =>
          expect(errorTip(app.container)).toContain(
            'no deployment within 10 s',
          ),
        )
      } finally {
        vi.useRealTimers()
      }
    })
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
