import React from 'react';

import StarOutlineIcon from '../../../assets/favorite-star.svg?react';
import RecentIcon from '../../../assets/recent.svg?react';
import cn from 'classnames';
import { ComboBoxType, FavoriteOrRecent } from '../../types';
import { Link } from 'react-router-dom';

export interface QuickBarSharedProps {
  className?: string;
}

export type BarElement<ID extends string | number> = {
  id: ID;
  title: string;
};

export interface InternalCommonBarProps<ID extends string | number> {
  activeId: ID | undefined;
  list: BarElement<ID>[];
  onClick: (id: ID) => void;
  comboboxType: ComboBoxType;
  favoriteOrRecent: FavoriteOrRecent;
  getEhLink: (id: ID) => string;
}

function BarHeaderWithIcon({
  favoriteOrRecent,
  comboboxType,
}: {
  comboboxType: ComboBoxType;
  favoriteOrRecent: FavoriteOrRecent;
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
  );
}

export function InternalCommonBar<ID extends string | number>({
  activeId,
  onClick,
  list,
  comboboxType,
  favoriteOrRecent,
  getEhLink,
}: InternalCommonBarProps<ID>) {
  if (list.length === 0) {
    return null;
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
          const isActive = element.id === activeId;
          return (
            <li
              key={element.id}
              onClick={(e) => {
                if (e.detail > 0) {
                  // when user do enter 2x times in opened selected input, button being called. Not sure how to fix it.
                  onClick(element.id);
                }
              }}
            >
              <Link
                to={getEhLink(element.id)}
                className={cn('duration-0', {
                  active: isActive,
                })}
              >
                {element.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
