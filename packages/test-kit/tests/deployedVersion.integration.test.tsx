/**
 * The deployed-version line under the jump card, mounted in the real App
 * through a deep link, as a person opening a bookmark sees it.
 */
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { waitFor } from '@testing-library/react'
import { createBackend, renderApp } from '../src/index'
import type { AppDeploymentsData } from '@env-hopper/backend-core'

type Row = AppDeploymentsData['deployments'][number]

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
  environmentSlug: 'staging',
  componentSlug: 'shop-ui',
  targetSlug: 'k8s:staging/shop',
  version: 'main-41',
  aliases: [],
  buildUrl: 'https://ci.example.com/pipelines/41',
  deployedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
  deployedBy: {
    username: 'jdoe',
    firstName: 'Jo',
    lastName: 'Doe',
    avatarUrl: null,
  },
  deployUrl: 'https://ci.example.com/pipelines/42',
  source: 'ci',
  endpoints: [],
  health: null,
  ...over,
})

const backend = (deployments: Record<string, AppDeploymentsData>) =>
  createBackend({
    apps: [
      { slug: 'shop', resourceJumps: '1-pager' },
      { slug: 'wiki', resourceJumps: '1-pager' },
    ],
    envs: [{ slug: 'dev' }, { slug: 'staging' }],
    deployments,
  })

const shopUi = { slug: 'shop-ui', displayName: 'UI' }
const shopApi = { slug: 'shop-api', displayName: 'API' }
const down = {
  state: 'down' as const,
  checker: 'http',
  observedAt: new Date().toISOString(),
  detail: '503',
}
const shopTwoComponents = (lead: Partial<Row> = {}): AppDeploymentsData => ({
  components: [shopApi, shopUi],
  leadComponentSlug: 'shop-ui',
  deployments: [
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
    deployments: Record<string, AppDeploymentsData>,
  ) => renderApp({ server, backend: backend(deployments), initialLink: link })

  const lines = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-testid="deployed-version"]',
      ),
    )

  test('a healthy deploy shows its Version and time, with no dot', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: {
        components: [shopUi],
        leadComponentSlug: null,
        deployments: [row({})],
      },
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
      shop: {
        components: [shopUi],
        leadComponentSlug: null,
        deployments: [row({})],
      },
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
})
