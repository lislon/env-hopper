import { createRouter } from '@tanstack/react-router'
import type { EhRouterInitParams } from '~/types/types'
import { routeTree } from '~/routeTree.gen'

export function createEhRouter({ context, history }: EhRouterInitParams) {
  return createRouter({
    routeTree,
    context,
    history,
    // Since we're using React Query, we don't want loader calls to ever be stale
    // This will ensure that the loader is always called when the route is preloaded or visited
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <div>404 - Page Not Found</div>,
    pathParamsAllowedCharacters: ['@'],
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createEhRouter>
  }
}
