import EyeOpenIcon from '../../assets/eye.svg?react';
import EyeCloseIcon from '../../assets/eye-closed.svg?react';
import { useMainAppFormContext } from '../context/MainFormContextProvider';
import cn from 'classnames';

export interface HideSensitiveDataToggleProps {
  className?: string;
}

export function HideSensitiveDataToggle({
  className,
}: HideSensitiveDataToggleProps) {
  const { isHideSensitiveInfo, setHideSensitiveInfo } = useMainAppFormContext();

  const onToggle = () => {
    setHideSensitiveInfo(!isHideSensitiveInfo);
  };

  return (
    <div
      className={cn(
        'hover:bg-base-content hover:bg-opacity-10 p-1 rounded-md cursor-pointer',
        className,
      )}
      onClick={onToggle}
    >
      {isHideSensitiveInfo ? (
        <EyeCloseIcon className={'w-4 h-4 '} />
      ) : (
        <EyeOpenIcon className={'w-4 h-4 '} />
      )}
    </div>
  );
}
