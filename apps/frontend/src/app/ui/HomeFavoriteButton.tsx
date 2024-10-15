import React from 'react';
import { FavoriteButton } from './FavoriteButton';

export interface HomeFavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => void;
  title: string;
}

export function HomeFavoriteButton({
  isFavorite,
  title,
  onClick,
}: HomeFavoriteButtonProps) {
  return (
    <div className="tooltip tooltip-right" data-tip={title}>
      <FavoriteButton
        title={title}
        className={'w-5 h-5'}
        isSelected={isFavorite}
        onClick={onClick}
      />
    </div>
  );
}
