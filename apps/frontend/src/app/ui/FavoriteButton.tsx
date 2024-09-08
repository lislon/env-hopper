import StarOutlineIcon from '../../assets/favorite-star.svg?react';
import cn from 'classnames';
import { MouseEventHandler } from 'react';

export interface StarIconProps {
  isSelected?: boolean;
  className?: string;
  onClick?: MouseEventHandler;
  title?: string;
}

export function FavoriteButton({
  isSelected,
  className,
  onClick,
  title,
}: StarIconProps) {
  return (
    <button onClick={onClick} title={title}>
      <StarOutlineIcon
        fill="none"
        className={cn(
          'w-4 hover:cursor-pointer hover:drop-shadow-[0_0_5px_rgba(250,204,21,0.9)] stroke-yellow-400 ',
          isSelected
            ? 'fill-yellow-400 stoke-yellow-400 opacity-100'
            : 'hover:stoke-yellow-400 opacity-30 hover:opacity-100',
          className,
        )}
      />
    </button>
  );
}
