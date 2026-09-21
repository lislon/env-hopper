import StarOutlineIcon from '../../assets/favorite-star.svg?react'
import RecentIcon from '../../assets/recent.svg?react'
import cn from 'classnames'
import type { ComboBoxType, FavoriteOrRecent } from '../../types'

export interface QuickBarSharedProps {
  className?: string
}

export type BarElement<TId extends string | number> = {
  id: TId
  title: string
}

export interface InternalCommonBarProps<TId extends string | number> {
  activeId: TId | undefined
  list: Array<BarElement<TId>>
  onClick: (id: TId) => void
  comboboxType: ComboBoxType
  favoriteOrRecent: FavoriteOrRecent
}

function BarHeaderWithIcon({
  favoriteOrRecent,
  comboboxType,
}: {
  comboboxType: ComboBoxType
  favoriteOrRecent: FavoriteOrRecent
}) {
  return (
    <div
      className={'menu-title tooltip tooltip-left flex gap-1 px-1 pt-1'}
      data-tip={`Click on ${favoriteOrRecent === 'favorite' ? 'favorite' : 'recently used'} ${comboboxType === 'applications' ? 'app' : 'env'} for quick preselect`}
    >
      {favoriteOrRecent === 'favorite' ? (
        <StarOutlineIcon
          fill="none"
          className={cn(
            'w-4 stroke-yellow-400 ',
            'fill-yellow-400 stoke-yellow-400 opacity-100',
          )}
        />
      ) : (
        <RecentIcon
          fill="none"
          className={cn('w-4', 'fill-gray-500 dark:fill-gray-200 opacity-100')}
        />
      )}
    </div>
  )
}

export function InternalCommonBar<TId extends string | number>({
  activeId,
  onClick,
  list,
  comboboxType,
  favoriteOrRecent,
}: InternalCommonBarProps<TId>) {
  if (list.length === 0) {
    return null
  }
  return (
    <div
      className="flex items-start"
      data-testid={`quick-bar-${comboboxType}-${favoriteOrRecent}`}
    >
      <BarHeaderWithIcon
        comboboxType={comboboxType}
        favoriteOrRecent={favoriteOrRecent}
      />
      <ul className="eh-quick-bar p-0 relative overflow-hidden flex-wrap">
        {list.map((element) => {
          const isActive = element.id === activeId
          return (
            <li
              key={element.id}
              onClick={(e) => {
                if (e.detail > 0) {
                  // when user do enter 2x times in opened selected input, button being called. Not sure how to fix it.
                  onClick(element.id)
                }
              }}
            >
              <button
                className={cn({
                  active: isActive,
                })}
                onClick={() => onClick(element.id)}
              >
                {element.title}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
