import { createFileRoute } from '@tanstack/react-router'
import { IconManagementPage } from '~/modules/icons/IconManagementPage'

export const Route = createFileRoute('/admin/icons')({
  component: IconsAdminPage,
  staticData: {
    breadcrumb: { title: 'Icons' },
  },
})

function IconsAdminPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold">Icons</h2>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <IconManagementPage />
      </div>
    </div>
  )
}
