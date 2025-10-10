import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/app-for-catalog')({
  component: AppCatalogLayoutRoute,
  staticData: {
    breadcrumb: { title: 'App Catalog' },
  },
})

function AppCatalogLayoutRoute() {
  return <Outlet />
}
