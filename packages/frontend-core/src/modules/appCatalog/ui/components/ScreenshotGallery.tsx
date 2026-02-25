import { useMemo } from 'react'

import type { AppForCatalog } from '@env-hopper/backend-core'

import { Gallery } from '~/modules/gallery/Gallery'
import type { GalleryImage } from '~/modules/gallery/Gallery'
import { Dialog, DialogContent } from '~/ui/dialog'

export interface ScreenshotGalleryProps {
  app: AppForCatalog
  screenshotIds: Array<string>
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
}

export function ScreenshotGallery({
  app,
  screenshotIds,
  initialIndex = 0,
  open,
  onOpenChange,
  title,
}: ScreenshotGalleryProps) {
  // Transform screenshot IDs to full URLs
  const images: Array<GalleryImage> = useMemo(
    () =>
      screenshotIds.map((id) => ({
        url: `/api/screenshots/${id}`,
        alt: `${app.displayName} screenshot`,
      })),
    [screenshotIds, app.displayName],
  )

  // Don't render if no screenshots
  if (screenshotIds.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[85vh] w-full max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] md:max-w-[calc(100vw-4rem)] p-0 overflow-hidden"
        showCloseButton={true}
      >
        <Gallery images={images} initialIndex={initialIndex} title={title} />
      </DialogContent>
    </Dialog>
  )
}
