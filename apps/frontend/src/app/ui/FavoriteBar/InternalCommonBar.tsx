import React from 'react';

import StarOutlineIcon from '../../../assets/favorite-star.svg?react';
import cn from 'classnames';

export type FavBarElement<ID extends string | number> = {
  id: ID;
  title: string;
};

export interface InternalCommonBarProps<ID extends string | number> {
  activeId: ID | undefined;
  sorted: FavBarElement<ID>[];
  onClick: (id: ID) => void;
}
export function InternalCommonBar<ID extends string | number>({
  activeId,
  onClick,
  sorted,
}: InternalCommonBarProps<ID>) {
  return (
    <section className="flex gap-1.5 text-xs flex-wrap">
      {sorted.map((element) => {
        const isActive = element.id === activeId;
        return (
          <button
            key={element.id}
            className={cn(
              'border px-2 py-1 rounded-md flex gap-0.5 items-center border-gray-400 text-nowrap hover:border-solid hover:bg-gray-200 dark:hover:bg-gray-700 hover:cursor-pointer',
              {
                'border-solid bg-gray-300 dark:bg-gray-500': isActive,
                'border-dashed': !isActive,
              },
            )}
            onClick={() => onClick(element.id)}
          >
            <div>
              <StarOutlineIcon
                fill="none"
                className={cn(
                  'w-3 stroke-yellow-400 ',
                  'fill-yellow-400 stoke-yellow-400 opacity-100',
                )}
              />
            </div>
            <div>{element.title}</div>
          </button>
        );
      })}
    </section>
  );
}
