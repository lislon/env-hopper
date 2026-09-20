import { describe, expect, it } from 'vitest'
import type { ResourceJumpsData } from '@env-hopper/backend-core'
import { buildJumpUrl } from '~/modules/resourceJump/utils/buildJumpUrl'

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
