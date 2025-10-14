import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { EhRouterContext } from '~/types/types'
import { RootErrorPage } from '~/ui/components/error/RootErrorPage'
import { NotFoundError } from '~/ui/error/NotFoundError'
import { LoadingScreen } from '~/ui/layout/LoadingScreen'

export const Route = createRootRouteWithContext<EhRouterContext>()({
  component: RootRoute,
  errorComponent: RootErrorPage,
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
