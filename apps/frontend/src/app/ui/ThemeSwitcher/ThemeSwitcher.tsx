import { useTheme } from '../../context/ThemeContext';
import MoonIcon from '../../../assets/moon.svg?react';
import SunIcon from '../../../assets/sun.svg?react';
import cn from 'classnames';

export interface ThemeSwitcherProps {
  className: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { switchTheme, currentTheme } = useTheme();

  const isDark = currentTheme === 'dark';
  const isLight = !isDark;
  const shared = 'absolute top-0 left-0 transition p-2 rounded-xl';
  return (
    <button
      onClick={switchTheme}
      className={cn('fill-black w-10 h-10', className)}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
    >
      {/*<SunIcon className={cn('absolute', { 'opacity-1': !isDark, 'opacity-0': isDark })} />*/}
      <SunIcon
        className={cn(shared, 'hover:bg-gray-200', {
          'fill-black': isLight,
          'opacity-0 translate-x-8': isDark,
        })}
      />
      <MoonIcon
        className={cn(shared, 'hover:bg-gray-700', {
          'fill-white': isDark,
          'opacity-0 translate-x-8': isLight,
        })}
      />
    </button>
  );
}
