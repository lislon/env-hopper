import { motion } from 'framer-motion'
import { BubblesIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { cn } from '~/lib/utils'

export interface SmoothSwitcherProps {
  values: Array<{ displayName: string; slug: string }>
  selectedValueSlug: string | undefined
  onValueSelect: (slug: string) => void
  className?: string
}

export function SmoothSwitcher({
  values,
  onValueSelect,
  selectedValueSlug,
  className,
}: SmoothSwitcherProps) {
  const [showArrowKeyHint, setShowArrowKeyHint] = useState(false)

  const layoutId = useId()

  const valuesEx = useMemo(() => {
    return values.map((e) => ({
      icon: <BubblesIcon className="w-3 h-3" />,
      slug: e.slug,
      displayName: e.displayName,
    }))
  }, [values])

  // useEffect(() => {
  //   function listener(e: KeyboardEvent) {

  //     if (e.key === 'ArrowDown') {
  //       const currentIndex = values.findIndex(fjr => fjr.key.slug == currentEnv?.slug);
  //       const nextIndex = currentIndex + 1
  //       const nextItem = values[nextIndex]?.key.slug;

  //       if (nextItem) {
  //         setCurrentEnv(nextItem)
  //       }
  //     }

  //     if (e.key === 'ArrowUp') {
  //       const currentIndex = values.findIndex(fjr => fjr.key.slug == currentEnv?.slug);
  //       const prevIndex = currentIndex - 1
  //       const prevItem = values[prevIndex]?.key.slug;

  //       if (prevItem) {
  //         setCurrentEnv(prevItem)
  //       }
  //     }
  //   }

  //   document.addEventListener('keydown', listener)

  //   return () => {
  //     document.removeEventListener('keydown', listener)
  //   }
  // }, [currentEnv?.slug, setCurrentEnv, values])

  return (
    <motion.div
      className={cn('flex flex-col gap-1 items-stretch', className)}
      layout
    >
      {valuesEx.map(({ slug, displayName, icon }) => {
        const isActive = selectedValueSlug === slug
        return (
          <button
            key={slug}
            type="button"
            onClick={() => {
              onValueSelect(slug)
              if (showArrowKeyHint === false) {
                setShowArrowKeyHint(true)
              }
            }}
            className={cn(
              // button sizing + layout
              'relative group z-10 h-8 leading-8 flex items-center gap-2 px-4 rounded-full text-sm select-none capitalize transition-transform',
              'hover:bg-accent/25',
              // icon sizing
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
              // text color (inactive / active)
              isActive ? 'text-foreground' : 'text-muted-foreground',
              // main ? 'text-xl font-semibold' : '',
            )}
          >
            {/* active background (shared layout) - placed before content so it sits under text */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
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
              <span className="relative z-10">{displayName}</span>
            </span>
          </button>
        )
      })}
    </motion.div>
  )
}
