import { motion } from 'framer-motion'
import { BubblesIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '~/lib/utils'
import { useResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'

export interface AppSwitcherProps {
  className?: string
}

export function AppSwitcher({ className }: AppSwitcherProps) {
  const [showArrowKeyHint, setShowArrowKeyHint] = useState(false)

  const { flagshipJumpResources, setCurrentFlagship, currentFlagship } = useResourceJumpContext()

  const themes = useMemo(() => {
    return flagshipJumpResources.slice(0, 3).map((fr) => ({
      icon: <BubblesIcon className="w-3 h-3" />,
      key: fr,
      main: false,
    }))
  }, [flagshipJumpResources]);

  // useEffect(() => {
  //   function listener(e: KeyboardEvent) {

  //     if (e.key === 'ArrowRight') {
  //       const currentIndex = themes.findIndex(fjr => fjr.key.slug == currentFlagship?.slug);
  //       const nextIndex = currentIndex + 1
  //       const nextItem = themes[nextIndex]?.key.slug;

  //       if (nextItem) {
  //         setCurrentFlagship(nextItem)
  //       }
  //     }

  //     if (e.key === 'ArrowLeft') {
  //       const currentIndex = themes.findIndex(fjr => fjr.key.slug == currentFlagship?.slug);
  //       const prevIndex = currentIndex - 1
  //       const prevItem = themes[prevIndex]?.key.slug;

  //       if (prevItem) {
  //         setCurrentFlagship(prevItem)
  //       }
  //     }
  //   }

  //   document.addEventListener('keydown', listener)

  //   return () => {
  //     document.removeEventListener('keydown', listener)
  //   }
  // }, [currentFlagship?.slug, setCurrentFlagship, themes])

  return (
    <motion.div className={cn('flex flex-col gap-1 items-start', className)} layout>
      {themes.map(({ key, icon, main }) => {
        const isActive = currentFlagship?.slug === key.slug
        return (
          <button
            key={key.slug}
            type="button"
            onClick={() => {
              setCurrentFlagship(key.slug)
              if (showArrowKeyHint === false) {
                setShowArrowKeyHint(true)
              }
            }}
            className={cn(
              'relative group z-10 h-8 leading-8 flex items-center m-auto gap-2 px-4 rounded-full text-xs cursor-pointer select-none capitalize transition-transform',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 w-full',
              // text color (inactive / active)
              isActive ? 'text-foreground' : 'text-muted-foreground',
              main ? 'text-xl font-semibold' : '',
            )}
          >
            {/* active background (shared layout) - placed before content so it sits under text */}
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                transition={{
                  type: 'spring',
                  stiffness: 250,
                  damping: 27,
                  mass: 1,
                }}
                className={cn(
                  'absolute left-0 top-0 h-8 w-full rounded-full bg-secondary z-0',
                  // allow hover/active visual changes via group state
                  'group-hover:bg-secondary/80 group-active:bg-secondary/90',
                )}
              />
            )}

            <span className="relative z-10 inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 relative z-10 inline-block overflow-clip">
                {icon}
              </span>
              <span className="relative z-10">{key.displayName}</span>
            </span>
          </button>
        )
      })}
    </motion.div>
  )
}
