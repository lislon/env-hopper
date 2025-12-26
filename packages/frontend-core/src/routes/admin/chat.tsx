import { createFileRoute } from '@tanstack/react-router'
import { AdminChat } from '~/modules/admin-base'

export const Route = createFileRoute('/admin/chat')({
  component: RouteComponent,
  staticData: {
    breadcrumb: { title: 'Chat' },
  },
})

function RouteComponent() {
  return <AdminChat />
}
