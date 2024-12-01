import React from 'react';
import StarOutlineIcon from '../../assets/favorite-star.svg?react';
import cn from 'classnames';

export interface HomeFavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => void;
  title: string;
  testId?: string;
}

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
      onClick={() => onClick?.()}
      title={title}
      data-testid={testId}
    >
      <StarOutlineIcon
        className={cn(
          'w-5 h-5 hover:cursor-pointer hover:drop-shadow-[0_0_5px_rgba(250,204,21,0.9)] ',
          isFavorite
            ? 'fill-yellow-400 stoke-yellow-400 opacity-100'
            : 'hover:stoke-yellow-400 opacity-60 dark:opacity-30 hover:opacity-100 stroke-base-content/30 ',
        )}
        fill="none"
      />
    </button>
  );
}
