import { Plus } from 'lucide-react'

interface AddWidgetCardProps {
  onClick?: () => void
}

export function AddWidgetCard({ onClick }: AddWidgetCardProps) {
  return (
    <div
      className="border-2 border-dashed border-muted h-32 rounded-md flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <Plus className="h-5 w-5 mb-1" />
      <span className="text-xs">Add widget…</span>
    </div>
  )
}
