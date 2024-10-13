import HelpIcon from '../../assets/help-circle.svg?react';
import cn from 'classnames';

export interface FaqButtonProps {
  onClick?: () => void;
  catchAttention?: boolean;
}

export function FaqButton({ onClick, catchAttention }: FaqButtonProps) {
  return (
    <button
      className={cn('btn', { 'animate-bounce text-accent': catchAttention })}
      onClick={onClick}
    >
      <HelpIcon
        className={cn('w-8 h-8 fill-white ', {
          'fill-accent': catchAttention,
        })}
      />
      What Does This Tool Do?
    </button>
  );
}
