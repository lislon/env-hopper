import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/approval-methods')({
  component: () => <Outlet />,
  staticData: {
    breadcrumb: {
      title: 'Approval Methods',
    },
  },
})
