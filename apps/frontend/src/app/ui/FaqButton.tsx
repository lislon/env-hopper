import HelpIcon from '../../assets/help-circle.svg?react';
import cn from 'classnames';

export interface FaqButtonProps {
  onClick?: () => void;
}

export function FaqButton({ onClick }: FaqButtonProps) {
  return (
    <button className={cn('btn')} onClick={onClick}>
      <HelpIcon className={cn('w-8 h-8 fill-white ')} />
    </button>
  );
}
