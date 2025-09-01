import { useTheme } from '../../context/ThemeContext';
import MoonIcon from '../../../assets/moon.svg?react';
import SunIcon from '../../../assets/sun.svg?react';
import cn from 'classnames';

export function ThemeSwitcher() {
  const { switchTheme, currentTheme } = useTheme();

  const isDark = currentTheme === 'dark';
  const isLight = !isDark;
  const shared = 'absolute transition rounded-xl p-2';
  return (
    <button
      onClick={switchTheme}
      className={cn('btn relative w-12 overflow-hidden')}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
    >
      <SunIcon
        className={cn(shared, '', {
          'fill-black': isLight,
          'opacity-0 translate-x-8': isDark,
        })}
      />
      <MoonIcon
        className={cn(shared, '', {
          'fill-white': isDark,
          'opacity-0 translate-x-8': isLight,
        })}
      />
    </button>
  );
}
