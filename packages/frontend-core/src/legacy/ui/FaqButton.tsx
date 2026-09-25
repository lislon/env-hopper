import cn from 'classnames'
import HelpIcon from '../assets/help-circle.svg?react'

export interface FaqButtonProps {
  onClick?: () => void
}

/**
 * INTENTIONAL DIFF: `aria-label`. The button's only content is an icon, so the
 * original had no accessible name at all — a screen reader announced "button".
 */
export function FaqButton({ onClick }: FaqButtonProps) {
  return (
    <button className={cn('btn')} onClick={onClick} aria-label="About">
      <HelpIcon className={cn('w-8 h-8 fill-white ')} />
    </button>
  )
}
