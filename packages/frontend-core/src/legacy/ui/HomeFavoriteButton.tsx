import cn from 'classnames'
import StarOutlineIcon from '../assets/favorite-star.svg?react'

export interface HomeFavoriteButtonProps {
  isFavorite: boolean
  onClick: () => void
  title: string
  testId?: string
}

/**
 * The star inside the env / app field that toggles the current selection as a
 * favourite. Favourites live in `EhContext`, so this is only the affordance.
 *
 * INTENTIONAL DIFF: the classes read `stroke-yellow-400`. The previous version
 * misspelled both of them `stoke-`, so the star's stroke — resting and on hover
 * — never applied and only the fill ever changed.
 */
export function HomeFavoriteButton({
  isFavorite,
  title,
  onClick,
  testId,
}: HomeFavoriteButtonProps) {
  return (
    <button
      className="tooltip tooltip-left"
      data-tip={title}
      onClick={onClick}
      title={title}
      data-testid={testId}
    >
      <StarOutlineIcon
        className={cn(
          'w-5 h-5 hover:cursor-pointer hover:drop-shadow-[0_0_5px_rgba(250,204,21,0.9)] ',
          isFavorite
            ? 'fill-yellow-400 stroke-yellow-400 opacity-100'
            : 'hover:stroke-yellow-400 opacity-60 dark:opacity-30 hover:opacity-100 stroke-base-content/30 ',
        )}
        fill="none"
      />
    </button>
  )
}
