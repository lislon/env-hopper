import { Button } from '~/components/ui/button'
import { AppIcon } from './AppIcon'
import type { EhAppIndexed } from '@env-hopper/backend-core'

interface ActionCardProps {
  app: EhAppIndexed
  actionName: string
  onClick: () => void
  className?: string
}

export function ActionCard({
  app,
  actionName,
  onClick,
  className,
}: ActionCardProps) {
  return (
    <Button
      variant="outline"
      className={`h-16 justify-start p-3 hover:bg-accent/50 transition-colors border-border/30 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-left">
        <AppIcon app={app} className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-medium leading-tight">{actionName}</span>
      </div>
    </Button>
  )
}
