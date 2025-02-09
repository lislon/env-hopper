import { CredentialsWidget } from '../widgets/CredentialsWidget'
import { VersionWidget } from '../widgets/VersionWidget'
import { AddWidgetCard } from './AddWidgetCard'

interface WidgetGridProps {
  widgets: ReadonlyArray<string>
  onAddWidget?: () => void
}

export function WidgetGrid({ widgets, onAddWidget }: WidgetGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
      {widgets.includes('creds') && <CredentialsWidget />}
      {widgets.includes('version') && <VersionWidget />}
      <AddWidgetCard onClick={onAddWidget} />
    </div>
  )
}
