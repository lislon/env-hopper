import { Navigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
})

function AdminIndexPage() {
  return <Navigate to="/admin/chat" replace />
}
