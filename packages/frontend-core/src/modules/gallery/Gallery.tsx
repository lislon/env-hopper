import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { clamp } from 'radashi'
import { useHotkeys } from 'react-hotkeys-hook'

import { Button } from '~/ui/button'
import { Spinner } from '~/ui/spinner'
import { cn } from '~/lib/utils'

export interface GalleryImage {
  url: string
  alt: string
}

export interface GalleryProps {
  images: Array<GalleryImage>
  initialIndex?: number
  onIndexChange?: (index: number) => void
  className?: string
  title?: string
}

export function Gallery({
  images,
  initialIndex = 0,
  onIndexChange,
  className,
  title,
}: GalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [currentIndex, setCurrentIndex] = useState(
    clamp(initialIndex, 0, images.length - 1),
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageStates, setImageStates] = useState<
    Record<number, 'loading' | 'loaded' | 'error'>
  >(() => Object.fromEntries(images.map((_, i) => [i, 'loading'])))

  // Reset image states when images array changes
  useEffect(() => {
    setImageStates(Object.fromEntries(images.map((_, i) => [i, 'loading'])))
  }, [images])

  // Stabilize onIndexChange callback with ref
  const onIndexChangeRef = useRef(onIndexChange)
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange
  }, [onIndexChange])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Sync current index with embla
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    const index = emblaApi.selectedScrollSnap()
    setCurrentIndex(index)
    onIndexChangeRef.current?.(index)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Scroll to initial index on mount only
  useEffect(() => {
    if (emblaApi && typeof initialIndex === 'number') {
      emblaApi.scrollTo(initialIndex)
    }
  }, [emblaApi, initialIndex])

  // Keyboard navigation
  useHotkeys(
    'left',
    (e) => {
      e.preventDefault()
      scrollPrev()
    },
    {
      enabled: images.length > 1,
      enableOnFormTags: false,
      preventDefault: true,
    },
    [scrollPrev, images.length],
  )
  useHotkeys(
    'right',
    (e) => {
      e.preventDefault()
      scrollNext()
    },
    {
      enabled: images.length > 1,
      enableOnFormTags: false,
      preventDefault: true,
    },
    [scrollNext, images.length],
  )
  useHotkeys(
    'escape',
    (e) => {
      if (isFullscreen) {
        e.preventDefault()
        setIsFullscreen(false)
      }
    },
    { enabled: isFullscreen, enableOnFormTags: false, preventDefault: true },
    [isFullscreen],
  )

  // Mouse wheel navigation with debouncing
  useEffect(() => {
    if (!emblaApi || images.length <= 1) return

    const emblaNode = emblaApi.rootNode()

    let isScrolling = false
    let scrollTimeout: NodeJS.Timeout

    const handleWheel = (event: WheelEvent) => {
      // Prevent page scroll when wheeling over gallery
      event.preventDefault()

      // Skip if already scrolling (debounce)
      if (isScrolling) return

      // Determine scroll direction
      const deltaY = event.deltaY
      const deltaX = event.deltaX

      // Use vertical scroll primarily, fall back to horizontal
      const delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX

      if (delta > 0) {
        // Scroll down/right -> next slide
        scrollNext()
      } else if (delta < 0) {
        // Scroll up/left -> previous slide
        scrollPrev()
      }

      // Set cooldown period
      isScrolling = true
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 300) // 300ms cooldown
    }

    emblaNode.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      emblaNode.removeEventListener('wheel', handleWheel)
      clearTimeout(scrollTimeout)
    }
  }, [emblaApi, scrollNext, scrollPrev, images.length])

  const currentImage = images[currentIndex]

  const handleImageLoad = (index: number) => {
    setImageStates((prev) => ({ ...prev, [index]: 'loaded' }))
  }

  const handleImageError = (index: number) => {
    setImageStates((prev) => ({ ...prev, [index]: 'error' }))
  }

  // Fullscreen mode
  if (isFullscreen && currentImage) {
    const imageState = imageStates[currentIndex]
    return (
      <div
        className="fixed inset-0 z-50 bg-background"
        role="dialog"
        aria-label="Fullscreen view"
      >
        {imageState === 'error' ? (
          <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="size-12" />
              <p className="text-sm">Failed to load image</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full overflow-auto p-2">
            {imageState !== 'loaded' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="size-8" />
              </div>
            )}
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="max-w-full h-auto"
              onLoad={() => handleImageLoad(currentIndex)}
              onError={() => handleImageError(currentIndex)}
              style={{ opacity: imageState === 'loaded' ? 1 : 0 }}
            />
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-10"
          aria-label="Exit fullscreen"
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col min-h-0', className)}>
      {/* Title Header */}
      {title && (
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      )}

      {/* Carousel Viewport with Peek Effect */}
      <div className="relative flex-1 min-h-0 overflow-hidden px-4">
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full gap-4">
            {images.map((image, index) => {
              const imageState = imageStates[index]
              // Use 100% width for single image, 85% for multiple (peek effect)
              const slideWidth = images.length === 1 ? '100%' : '85%'
              return (
                <div
                  key={image.url}
                  className={cn(
                    'relative flex min-w-0 items-center justify-center transition-opacity duration-300 h-full',
                    index !== currentIndex && 'opacity-40',
                  )}
                  style={{ flexBasis: slideWidth, flexShrink: 0, flexGrow: 0 }}
                >
                  {imageState === 'error' ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageOff className="size-12" />
                      <p className="text-xs">Failed to load</p>
                    </div>
                  ) : (
                    <>
                      {imageState !== 'loaded' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Spinner className="size-8" />
                        </div>
                      )}
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="max-w-full max-h-full w-auto h-auto object-contain cursor-pointer border border-border/30 rounded"
                        onClick={() => {
                          if (index !== currentIndex) {
                            emblaApi?.scrollTo(index)
                          }
                        }}
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index)}
                        style={{ opacity: imageState === 'loaded' ? 1 : 0 }}
                        role="button"
                        aria-label={`Navigate to ${image.alt}`}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={images.length <= 1}
          aria-label="Previous screenshot"
          className="h-12 w-12"
        >
          <ChevronLeft className="h-12 w-12" />
        </Button>

        <div className="text-sm text-muted-foreground" aria-live="polite">
          {currentIndex + 1} / {images.length}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={images.length <= 1}
          aria-label="Next screenshot"
          className="h-12 w-12"
        >
          <ChevronRight className="h-12 w-12" />
        </Button>
      </div>
    </div>
  )
}
