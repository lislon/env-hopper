import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { Button } from '~/ui/button'
import type { Screenshot } from './ScreenshotManager'

interface ScreenshotItemProps {
  screenshot: Screenshot
  onDelete: () => void
}

export function ScreenshotItem({ screenshot, onDelete }: ScreenshotItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screenshot.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="aspect-video rounded-md overflow-hidden border border-border bg-muted">
        <img
          src={screenshot.url}
          alt="Screenshot"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 rounded-md bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-red-500/20"
          onClick={onDelete}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
