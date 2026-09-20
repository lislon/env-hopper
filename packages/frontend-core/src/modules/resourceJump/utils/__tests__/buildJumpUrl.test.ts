import { describe, expect, it } from 'vitest'
import type { EhAppIndexed, ResourceJumpsData } from '@env-hopper/backend-core'
import { buildJumpUrl } from '~/modules/resourceJump/utils/buildJumpUrl'
import { buildEhTemplateParams } from '~/modules/uiSettings/ehTemplate'
import { appSlugFromJumpSlug } from '~/util/route-utils'

const resourceJumpsData: ResourceJumpsData = {
  lateResolvableParams: [{ slug: 'namespace', displayName: 'Namespace' }],
  resourceJumps: [
    {
      slug: 'cli-credentials',
      displayName: 'CLI credentials',
      urlTemplate: {
        default:
          'https://{{subdomain}}.example.com/pods?ns={{namespace ?? --all-namespaces}}',
      },
      lateResolvableParamSlugs: ['namespace'],
    },
  ],
  envs: [
    { slug: 'dev', displayName: 'Dev', templateParams: { subdomain: 'dev' } },
  ],
}

// One url pattern shared by every environment, which is the shape that lets a
// deployment ship the pattern once instead of per (jump, environment).
const patternJumpsData: ResourceJumpsData = {
  lateResolvableParams: [],
  resourceJumps: [
    {
      slug: 'app-pattern',
      displayName: 'App',
      urlTemplate: { default: '{{app.meta.urlPattern}}/health' },
    },
  ],
  envs: [
    {
      slug: 'dev',
      displayName: 'Dev',
      templateParams: { subdomain: 'dev', domain: 'example.com' },
    },
    {
      slug: 'staging',
      displayName: 'Staging',
      templateParams: { subdomain: 'staging', domain: 'example.com' },
    },
  ],
}

describe('buildJumpUrl', () => {
  it('falls back to a template default when the late param has no value', () => {
    const url = buildJumpUrl('cli-credentials', 'dev', resourceJumpsData)

    expect(url).toBe('https://dev.example.com/pods?ns=--all-namespaces')
  })

  it('prefers the late param value over the template default', () => {
    const url = buildJumpUrl('cli-credentials', 'dev', resourceJumpsData, {
      namespace: 'team-a',
    })

    expect(url).toBe('https://dev.example.com/pods?ns=team-a')
  })

  it('resolves an app-level url pattern against the env params', () => {
    const url = buildJumpUrl(
      'app-pattern',
      'dev',
      patternJumpsData,
      undefined,
      { 'app.meta.urlPattern': 'https://{{subdomain}}.{{domain}}' },
    )

    expect(url).toBe('https://dev.example.com/health')
  })

  it('lets the env override an app-level placeholder', () => {
    const url = buildJumpUrl(
      'app-pattern',
      'staging',
      patternJumpsData,
      undefined,
      {
        'app.meta.urlPattern': 'https://{{subdomain}}.{{domain}}',
        subdomain: 'app-default',
      },
    )

    expect(url).toBe('https://staging.example.com/health')
  })

  it('does not interpret a user-typed value as template syntax', () => {
    const url = buildJumpUrl('cli-credentials', 'dev', resourceJumpsData, {
      namespace: '{{subdomain}}',
    })

    expect(url).toBe('https://dev.example.com/pods?ns={{subdomain}}')
  })
})

/**
 * A jump slug is not interchangeable with an app slug, so these drive the app
 * lookup the way a caller must: derive the app key from the jump slug. Covers
 * both shapes — a grouped app, whose slug carries no page, and a single-page app
 * whose one page is not named `home`, whose slug does.
 */
describe('buildJumpUrl with app metadata', () => {
  const apps: Record<string, EhAppIndexed> = {
    orders: {
      slug: 'orders',
      displayName: 'Orders',
      meta: { urlPattern: 'https://{{subdomain}}.example.com/orders' },
    },
    reports: {
      slug: 'reports',
      displayName: 'Reports',
      meta: { urlPattern: 'https://{{subdomain}}.example.com/reports' },
    },
  }

  const jumpsData: ResourceJumpsData = {
    lateResolvableParams: [],
    resourceJumps: [
      {
        slug: 'orders@shipments',
        displayName: 'Orders :: Shipments',
        urlTemplate: { default: '{{app.meta.urlPattern}}/shipments' },
      },
      {
        slug: 'reports@dashboard',
        displayName: 'Reports',
        urlTemplate: { default: '{{app.meta.urlPattern}}/dashboard' },
      },
    ],
    envs: [
      {
        slug: 'dev',
        displayName: 'Dev',
        templateParams: { subdomain: 'dev' },
      },
    ],
    groups: [
      {
        slug: 'orders',
        displayName: 'Orders',
        resourceSlugs: ['orders@shipments'],
      },
    ],
  }

  function jumpUrlFor(jumpSlug: string) {
    const app = apps[appSlugFromJumpSlug(jumpSlug)]
    return buildJumpUrl(
      jumpSlug,
      'dev',
      jumpsData,
      undefined,
      app ? buildEhTemplateParams({ app }) : undefined,
    )
  }

  it('resolves app meta for a child page of a grouped app', () => {
    expect(jumpUrlFor('orders@shipments')).toBe(
      'https://dev.example.com/orders/shipments',
    )
  })

  it('resolves app meta for an ungrouped app whose page is not named home', () => {
    expect(jumpUrlFor('reports@dashboard')).toBe(
      'https://dev.example.com/reports/dashboard',
    )
  })

  it('would miss if the raw jump slug were used as the app key', () => {
    // The defect this pins: keyed by the jump slug, the lookup finds nothing and
    // the placeholder is left unresolved rather than failing loudly.
    expect(apps['reports@dashboard']).toBeUndefined()
  })
})
