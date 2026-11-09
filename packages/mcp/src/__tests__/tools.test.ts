import { describe, expect, it } from 'vitest'
import type { Catalog } from '@env-hopper/backend-core'
import { toMcpData } from '../mcpData'
import {
  getDatabaseAccess,
  getLogin,
  getUrl,
  listApps,
  listEnvs,
  parseJdbc,
} from '../tools'
import { EH, fixtureBootstrap, fixtureJumps } from './fixture'

const given = () => toMcpData(fixtureBootstrap, fixtureJumps, `${EH}/`)

describe('get_url', () => {
  it('a close-guess env is used and the runner-up named; a param alias and its default jump pick the page', () => {
    expect(getUrl(given(), { env: 'alpha', params: { case: '42' } })).toEqual({
      url: 'https://orders-alpha1.example.test/case?id=42',
      ehUrl: `${EH}/env/alpha-integration-01/app/orders@case-view/sub/42`,
      env: 'alpha-integration-01',
      params: { caseId: '42' },
      jump: 'orders@case-view',
      options: { env: [{ slug: 'alphabox-01', name: 'alphabox-01' }] },
    })
  })

  it('a jump name two pages answer equally: null, both as options, no link', () => {
    expect(
      getUrl(given(), {
        env: 'alpha-integration-01',
        app: 'desk',
        jump: 'case',
        params: { caseId: '1' },
      }),
    ).toEqual({
      env: 'alpha-integration-01',
      app: 'orders',
      params: { caseId: '1' },
      jump: null,
      options: {
        jump: [
          { slug: 'orders@case-review', name: 'Order Desk · Review case #' },
          { slug: 'orders@case-view', name: 'Order Desk · View case #' },
        ],
      },
    })
  })

  it('params alone, taken by pages of several apps and no default: null, the pages as options', () => {
    expect(
      getUrl(given(), {
        env: 'alpha-integration-01',
        params: { orderId: '7' },
      }),
    ).toEqual({
      env: 'alpha-integration-01',
      params: { orderId: '7' },
      jump: null,
      options: {
        jump: [
          { slug: 'orders@order', name: 'Order Desk · Order #' },
          {
            slug: 'billing@invoice',
            name: 'Billing Console · Invoice by order #',
          },
        ],
      },
    })
  })

  it('a param the page needs is missing: no url, missingParams, the home page meanwhile', () => {
    expect(
      getUrl(given(), {
        env: 'alpha-integration-01',
        app: 'orders',
        jump: 'case review',
      }),
    ).toEqual({
      ehUrl: `${EH}/env/alpha-integration-01/app/orders@case-review`,
      env: 'alpha-integration-01',
      app: 'orders',
      jump: 'orders@case-review',
      missingParams: ['caseId'],
      homeUrl: 'https://orders-alpha1.example.test/home',
    })
  })

  it('a known param the page does not take is reported unused', () => {
    expect(
      getUrl(given(), {
        env: 'alpha-integration-01',
        app: 'billing',
        params: { caseId: '5' },
      }),
    ).toEqual({
      url: 'https://billing-alpha1.example.test/',
      ehUrl: `${EH}/env/alpha-integration-01/app/billing`,
      env: 'alpha-integration-01',
      app: 'billing',
      params: { caseId: '5' },
      jump: 'billing',
      unusedParams: ['caseId'],
    })
  })

  it('words that match nothing: null with the closest spellings, and no links', () => {
    expect(
      getUrl(given(), { env: 'integration-alpha', params: { cliniq: '3' } }),
    ).toEqual({
      env: null,
      params: { cliniq: null },
      options: {
        env: [
          { slug: 'alpha-integration-01', name: 'alpha-integration-01' },
          { slug: 'alphabox-01', name: 'alphabox-01' },
          { slug: 'production', name: 'production' },
        ],
        params: { cliniq: [{ slug: 'clinicId', name: 'Clinic Id' }] },
      },
    })
  })

  it('no env: only the EH link, where the user picks the env', () => {
    expect(getUrl(given(), { app: 'desk', params: { caseId: '9' } })).toEqual({
      ehUrl: `${EH}/app/orders@case-view/sub/9`,
      app: 'orders',
      params: { caseId: '9' },
      jump: 'orders@case-view',
    })
  })

  it('prod uses its own host override', () => {
    expect(
      getUrl(given(), {
        env: 'production',
        jump: 'orders@order',
        params: { orderId: '1' },
      }).url,
    ).toBe('https://orders.example.test/order/1')
  })
})

describe('get_login and get_database_access', () => {
  it('staging: every shared login, placeholders resolved', () => {
    expect(
      getLogin(given(), { app: 'order desk', env: 'alpha-integration-01' }),
    ).toEqual({
      env: 'alpha-integration-01',
      app: 'orders',
      logins: [
        {
          label: 'admin',
          desc: 'Admin user',
          username: 'admin',
          password: 'pw1',
        },
        { label: 'viewer', username: 'viewer@alpha1', password: 'pw2' },
      ],
    })
  })

  it('prod: the access-request link instead of logins', () => {
    expect(getLogin(given(), { app: 'OD', env: 'production' })).toEqual({
      env: 'production',
      app: 'orders',
      requestAccess: { url: 'https://access.example.test/app/order-desk' },
    })
  })

  it('an app without logins: []', () => {
    expect(
      getLogin(given(), { app: 'billing', env: 'alpha-integration-01' }),
    ).toEqual({ env: 'alpha-integration-01', app: 'billing', logins: [] })
  })

  it('staging database: the JDBC url and its parts', () => {
    expect(
      getDatabaseAccess(given(), {
        app: 'orders',
        env: 'alpha-integration-01',
      }),
    ).toEqual({
      env: 'alpha-integration-01',
      app: 'orders',
      databases: [
        {
          url: 'jdbc:mysql://orders-db-alpha1.example.test:3306/orders',
          host: 'orders-db-alpha1.example.test',
          port: 3306,
          database: 'orders',
          username: 'app',
          password: 'secret',
        },
      ],
    })
  })

  it('prod database for an app with no access page: []', () => {
    expect(
      getDatabaseAccess(given(), { app: 'billing', env: 'production' }),
    ).toEqual({
      env: 'production',
      app: 'billing',
      databases: [],
    })
  })

  it('an abbreviation shared by several apps names none of them', () => {
    expect(
      getLogin(given(), { app: 'TOOLS', env: 'production' }).app,
    ).toBeNull()
  })

  it('parses JDBC urls without a port or database', () => {
    expect(parseJdbc('jdbc:postgresql://h.example.test/db?ssl=true')).toEqual({
      host: 'h.example.test',
      database: 'db',
    })
  })
})

describe('list_apps and list_envs', () => {
  it('query matches jump and param names, not only app names', () => {
    expect(listApps(given(), { query: 'clinic' })).toEqual({
      apps: [
        {
          slug: 'reports',
          name: 'Report Viewer',
          jumps: [
            {
              slug: 'reports@clinic',
              name: 'Clinic report #',
              params: ['clinicId'],
            },
          ],
        },
      ],
    })
  })

  it('envs with their credentials kind', async () => {
    expect(await listEnvs(given(), null, {})).toEqual({
      envs: [
        { slug: 'alpha-integration-01', credentials: 'shared' },
        { slug: 'alphabox-01', credentials: 'shared' },
        { slug: 'production', type: 'prod', credentials: 'requestAccess' },
      ],
    })
  })

  it('an app whose deployments are not tracked says so rather than "not deployed"', async () => {
    expect(await listEnvs(given(), null, { app: 'billing' })).toEqual({
      app: 'billing',
      deployedTracked: false,
    })
  })

  it('with an app: the envs it is deployed on, version and health; targets outside envs left out', async () => {
    const catalog = {
      getComponents: () =>
        Promise.resolve({ orders: [{ slug: 'orders-api' }] }),
      listDeployments: () =>
        Promise.resolve([
          {
            component: {
              slug: 'orders-api',
              displayName: 'API',
              appSlug: 'orders',
            },
            target: {
              slug: 't1',
              displayName: 't1',
              environmentSlug: 'alpha-integration-01',
              meta: {},
            },
            artifact: { version: '1.2.3' },
            health: { state: 'up' },
            deployedAt: new Date('2026-01-02T03:04:05Z'),
          },
          {
            component: {
              slug: 'orders-api',
              displayName: 'API',
              appSlug: 'orders',
            },
            target: {
              slug: 'ci:7',
              displayName: 'ci',
              environmentSlug: null,
              meta: {},
            },
            artifact: { version: '0.0.1' },
            health: null,
            deployedAt: null,
          },
        ]),
    } as unknown as Catalog
    expect(await listEnvs(given(), catalog, { app: 'orders' })).toEqual({
      app: 'orders',
      deployedTracked: true,
      envs: [
        {
          env: 'alpha-integration-01',
          version: '1.2.3',
          health: 'up',
          deployedAt: '2026-01-02T03:04:05.000Z',
        },
      ],
    })
  })
})
