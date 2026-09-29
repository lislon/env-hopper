import { Outlet, createFileRoute } from '@tanstack/react-router'
import { EhShell } from '~/ui/skin/EhShell'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <EhShell>
      <Outlet />
    </EhShell>
  )
}
