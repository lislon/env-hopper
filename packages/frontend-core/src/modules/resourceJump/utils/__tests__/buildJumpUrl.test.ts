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
})
