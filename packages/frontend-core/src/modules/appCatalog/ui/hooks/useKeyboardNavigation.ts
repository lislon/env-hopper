import type { AppForCatalog } from '@env-hopper/backend-core'
import React from 'react'

export interface UseKeyboardNavigationProps {
  apps: Array<AppForCatalog>
  selectedAppSlug?: string
  onAppClick?: (app: AppForCatalog) => void
}

export function useKeyboardNavigation({
  apps,
  selectedAppSlug,
  onAppClick,
}: UseKeyboardNavigationProps) {
  const rowRefs = React.useRef<Map<string, HTMLTableRowElement>>(new Map())

  // Keyboard navigation (ArrowUp/ArrowDown)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

      // Prevent default scrolling behavior
      event.preventDefault()

      const currentIndex = selectedAppSlug
        ? apps.findIndex((app) => app.slug === selectedAppSlug)
        : -1

      let nextIndex: number
      if (event.key === 'ArrowDown') {
        nextIndex =
          currentIndex === -1 ? 0 : Math.min(currentIndex + 1, apps.length - 1)
      } else {
        nextIndex = currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0)
      }

      const nextApp = apps[nextIndex]
      if (nextApp && nextApp.slug !== selectedAppSlug) {
        onAppClick?.(nextApp)

        // Scroll the newly selected row into view
        const rowElement = rowRefs.current.get(nextApp.slug)
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [apps, selectedAppSlug, onAppClick])

  return { rowRefs }
}
