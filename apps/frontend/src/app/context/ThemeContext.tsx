'use client';
import React, { createContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type EhTheme = 'system' | 'dark' | 'white';

//  createContext is not supported in Server Components
const ThemeContext = createContext<EhTheme>('system');

export function useTheme() {
  const [, setPreference] = useLocalStorage<EhTheme>('theme', 'system');

  return {
    currentTheme: getTheme(),
    switchTheme: () => {
      if (getTheme() === 'dark') {
        switchTheme('white');
        setPreference('white');
      } else {
        switchTheme('dark');
        setPreference('dark');
      }
    },
  };
}

function switchTheme(theme: EhTheme) {
  document.body.classList.remove('dark');
  if (
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.body.classList.add('dark');
  }
}

function getTheme(): EhTheme {
  if (document.body.classList.contains('dark')) {
    return 'dark';
  } else {
    return 'white';
  }
}

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userPreference] = useLocalStorage<EhTheme>('theme', 'system');
  switchTheme(userPreference);

  return (
    <ThemeContext.Provider value={'system'}>{children}</ThemeContext.Provider>
  );
}
