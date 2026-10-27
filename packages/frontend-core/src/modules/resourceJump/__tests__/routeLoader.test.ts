import { QueryClient } from '@tanstack/react-query'
import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import type { RenameRule, ResourceJumpsData } from '@env-hopper/backend-core'
import type { EhRouterContext } from '~/types/types'
import { routeLoader } from '~/modules/resourceJump/routeLoader'

const jumps: ResourceJumpsData = {
  resourceJumps: [
    { slug: 'orders', displayName: 'Orders', urlTemplate: { default: 'x' } },
  ],
  envs: [],
  lateResolvableParams: [],
}

function contextWith(rule: RenameRule | false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  })
  queryClient.setQueryData(['resourceJumps'], jumps)
  const tryFindRenameRule = vi.fn(async () => rule)
  const context = {
    queryClient,
    trpcClient: { tryFindRenameRule: { query: tryFindRenameRule } },
  } as unknown as EhRouterContext
  return { context, tryFindRenameRule }
}

async function thrownBy(p: Promise<unknown>) {
  try {
    await p
  } catch (e) {
    return e
  }
  return undefined
}

describe('routeLoader renames', () => {
  it('redirects an old app slug to the one the backend names, keeping env and value', async () => {
    const { context } = contextWith({
      type: 'resourceRename',
      oldSlug: 'old-orders',
      targetSlug: 'orders',
    })
    const thrown = await thrownBy(
      routeLoader({
        params: { envSlug: 'staging', appSlug: 'old-orders', subValue: '42' },
        context,
      }),
    )
    expect(isRedirect(thrown)).toBe(true)
    expect((thrown as { options: unknown }).options).toMatchObject({
      to: '/env/$envSlug/app/$appSlug/sub/$subValue',
      params: { envSlug: 'staging', appSlug: 'orders', subValue: '42' },
      replace: true,
    })
  })

  it('asks nothing for a slug a jump has', async () => {
    const { context, tryFindRenameRule } = contextWith(false)
    const out = await routeLoader({
      params: { envSlug: 'staging', appSlug: 'orders' },
      context,
    })
    expect(out.resourceSlug).toBe('orders')
    expect(tryFindRenameRule).not.toHaveBeenCalled()
  })

  it('keeps an unknown slug without a rename as it is', async () => {
    const { context } = contextWith(false)
    const out = await routeLoader({
      params: { appSlug: 'nowhere' },
      context,
    })
    expect(out.resourceSlug).toBe('nowhere')
  })
})
