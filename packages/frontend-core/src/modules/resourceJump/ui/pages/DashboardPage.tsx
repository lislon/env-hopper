import { ResourceJumpMockTable } from '~/modules/resourceJump/ui/ResourceJumpMockTable'

export function DashboardPage() {
  return (
    <div className="py-6 flex flex-col gap-4">
      <div>
        <div className="font-medium">Hopper</div>
        <div className="text-sm text-muted-foreground">Dashboard</div>
      </div>
      <ResourceJumpMockTable />
    </div>
  )
}
