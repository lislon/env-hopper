import * as React from 'react'
import { Button } from './button'
import type { ButtonProps } from './button'
import { cn } from '~/lib/utils'

export interface ShortcutButtonProps extends ButtonProps {
  /**
   * The text to display on the button.
   */
  text: string
  /**
   * The keyboard key to display (e.g., 'K'). Will be formatted as ⌘K on Mac or Ctrl+K on other platforms.
   * If not provided, defaults to 'K'.
   */
  shortcutKey?: string
  /**
   * Custom shortcut text to display. If provided, this takes precedence over shortcutKey.
   * Useful for custom shortcuts like '⌘⇧K' or 'Ctrl+Shift+K'.
   */
  shortcut?: string
}

const ShortcutButton = ({
  ref,
  text,
  shortcutKey = 'K',
  shortcut,
  className,
  ...props
}: ShortcutButtonProps & {
  ref?: React.RefObject<HTMLButtonElement | null>
}) => {
  const displayShortcut = React.useMemo(() => {
    if (shortcut) return shortcut

    // Auto-format the shortcut key based on platform
    const isMac =
      typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
    return isMac ? `⌘${shortcutKey}` : `Ctrl+${shortcutKey}`
  }, [shortcut, shortcutKey])

  return (
    <Button ref={ref} className={cn('relative pr-10', className)} {...props}>
      {text}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none bg-secondary px-2 py-1 rounded-lg transition-colors duration-200">
        {displayShortcut}
      </div>
    </Button>
  )
}

ShortcutButton.displayName = 'ShortcutButton'

export { ShortcutButton }
