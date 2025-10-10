import { createFileRoute } from '@tanstack/react-router'
import { AppCatalogAdminPage } from '~/modules/appCatalog/AppCatalogAdminPage'

export const Route = createFileRoute('/admin/app-for-catalog/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold">App Catalog</h2>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <AppCatalogAdminPage />
      </div>
    </div>
  )
}
