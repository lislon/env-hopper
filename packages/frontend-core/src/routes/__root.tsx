import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { EhRouterContext } from '~/types/types'
import { RooutErrorPage } from '~/ui/components/error/RooutErrorPage'
import { NotFoundError } from '~/ui/error/NotFoundError'
import { LoadingScreen } from '~/ui/layout/LoadingScreen'

export const Route = createRootRouteWithContext<EhRouterContext>()({
  component: RootRoute,
  errorComponent: RooutErrorPage,
  pendingComponent: () => <LoadingScreen />,
  notFoundComponent: () => <NotFoundError />,
  wrapInSuspense: true,
})

function RootRoute() {
  return (
    <div className="min-h-screen bg-base-200">
      <Outlet />
      {import.meta.env.MODE === 'dev' ? <TanStackRouterDevtools /> : null}
    </div>
  )
}
