import * as React from 'react'
import { cn } from '~/lib/utils'

export interface ShortcutButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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

const ShortcutButton = (
    { ref, text, shortcutKey = 'K', shortcut, className, ...props }: ShortcutButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> },
  ) => {
    const displayShortcut = React.useMemo(() => {
      if (shortcut) return shortcut

      // Auto-format the shortcut key based on platform (it's not actually deprecated)
      const isMac =
        typeof navigator !== 'undefined' &&
        navigator.platform.includes('Mac')
      return isMac ? `⌘${shortcutKey}` : `Ctrl+${shortcutKey}`
    }, [shortcut, shortcutKey])

    const { onClick, ...buttonProps } = props

    return (
      <div
        className={cn(
          'flex items-center h-10 w-full rounded-md border border-input bg-background text-sm',
          'hover:bg-accent hover:border-accent/50 cursor-default',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-accent/50 focus-within:bg-accent',
          'transition-colors duration-200',
          className,
        )}
        onClick={
          onClick
            ? (e) => onClick(e as unknown as React.MouseEvent<HTMLButtonElement>)
            : undefined
        }
      >
        <button
          ref={ref}
          type="button"
          className={cn(
            'flex-1 h-full px-3 py-2 text-left transition-colors duration-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:outline-none',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(e)
          }}
          {...buttonProps}
        >
          <span className="text-muted-foreground">{text}</span>
        </button>
        <span
          className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg mr-3 shrink-0"
        >
          {displayShortcut}
        </span>
      </div>
    )
  }

ShortcutButton.displayName = 'ShortcutButton'

export { ShortcutButton }

