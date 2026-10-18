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

const row = (over: Partial<Row>): Row => ({
  environmentSlug: 'staging',
  componentSlug: 'shop-api',
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
  deployUrl: null,
  source: 'ci',
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

const shopApi = { slug: 'shop-api', displayName: 'API' }
const shopUi = { slug: 'shop-ui', displayName: 'UI' }

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

  test('a healthy deploy shows its Version, links the build, and draws no dot', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: { components: [shopApi], deployments: [row({})] },
    })
    await waitFor(() => expect(lines(app.container)).toHaveLength(1))
    const [line] = lines(app.container)
    const link = line!.querySelector('a')
    expect(link).toHaveAttribute('href', 'https://ci.example.com/pipelines/41')
    expect(link).toHaveTextContent('main-41')
    expect(line!.querySelector('.eh-deployed-dot')).toBeNull()
    expect(line!.textContent).toContain('15 min ago')
    expect(line!.querySelector('[role="tooltip"]')?.textContent).toContain(
      'by Jo Doe · via ci',
    )
  })

  test('a down deploy gets the red dot; several Components get a row each', async () => {
    const app = await open('/env/staging/app/shop', {
      shop: {
        components: [shopApi, shopUi],
        deployments: [
          row({
            health: {
              state: 'down',
              checker: 'http',
              observedAt: new Date().toISOString(),
              detail: '503',
            },
          }),
          row({ componentSlug: 'shop-ui', version: 'main-9' }),
        ],
      },
    })
    await waitFor(() => expect(lines(app.container)).toHaveLength(2))
    const [api, ui] = lines(app.container)
    expect(api!.querySelector('.eh-deployed-label')).toHaveTextContent('API')
    expect(api!.querySelector('.eh-deployed-dot-down')).not.toBeNull()
    expect(ui!.querySelector('.eh-deployed-dot')).toBeNull()
  })

  test('a Component not deployed on this Environment says so, with a grey dot', async () => {
    const app = await open('/env/dev/app/shop', {
      shop: { components: [shopApi], deployments: [row({})] },
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
