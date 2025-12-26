import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Upload } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Button } from '~/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/ui/card'
import { ScreenshotItem } from './ScreenshotItem'

export interface Screenshot {
  id: string
  url: string
  order?: number
}

interface ScreenshotManagerProps {
  screenshots: Array<Screenshot>
  onScreenshotsChange: (screenshots: Array<Screenshot>) => void
  onAddScreenshot?: (file: File) => Promise<{ id: string; url: string }>
}

export function ScreenshotManager({
  screenshots,
  onScreenshotsChange,
  onAddScreenshot,
}: ScreenshotManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [screenshotList, setScreenshotList] = useState<Array<Screenshot>>(screenshots)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = screenshotList.findIndex((s) => s.id === active.id)
      const newIndex = screenshotList.findIndex((s) => s.id === over.id)

      const newList = arrayMove(screenshotList, oldIndex, newIndex)
      setScreenshotList(newList)
      onScreenshotsChange(newList)
    }
  }

  const handleDeleteScreenshot = useCallback(
    (id: string) => {
      const newList = screenshotList.filter((s) => s.id !== id)
      setScreenshotList(newList)
      onScreenshotsChange(newList)
    },
    [screenshotList, onScreenshotsChange],
  )

  const handleFiles = async (file: File | null) => {
    if (!file || !onAddScreenshot) return

    setIsUploading(true)
    try {
      const newScreenshot = await onAddScreenshot(file)
      const newList = [...screenshotList, newScreenshot]
      setScreenshotList(newList)
      onScreenshotsChange(newList)
    } catch (error) {
      console.error('Failed to upload screenshot:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files?.[0] ?? null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0] ?? null
    void handleFiles(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screenshots</CardTitle>
        <CardDescription>
          Upload and organize screenshots. Drag to reorder, click X to delete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading || !onAddScreenshot}
        />

        <div
          className={`border border-dashed rounded-md p-4 text-center transition-colors ${
            isDraggingOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
          } ${!onAddScreenshot ? 'opacity-60' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            if (!onAddScreenshot) return
            setIsDraggingOver(true)
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-5 h-5" />
            <p className="text-sm text-muted-foreground">
              Drag images here or
              <Button
                type="button"
                variant="link"
                className="px-1"
                disabled={isUploading || !onAddScreenshot}
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </Button>
              to upload
            </p>
            <Button
              type="button"
              disabled={isUploading || !onAddScreenshot}
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              {isUploading ? 'Uploading...' : 'Select Image'}
            </Button>
          </div>
        </div>

        {screenshotList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No screenshots yet. Upload one to get started.
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={screenshotList.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {screenshotList.map((screenshot) => (
                  <ScreenshotItem
                    key={screenshot.id}
                    screenshot={screenshot}
                    onDelete={() => handleDeleteScreenshot(screenshot.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}
