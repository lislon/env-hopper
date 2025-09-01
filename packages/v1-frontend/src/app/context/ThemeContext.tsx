'use client';
import React, { createContext, useContext, useLayoutEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type EhTheme = 'dark' | 'light';

//  createContext is not supported in Server Components

export interface ThemeContextValue {
  userPreference: EhTheme;
  setUserPreference: (theme: EhTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }

  return {
    currentTheme: ctx.userPreference,
    switchTheme: () => {
      if (getTheme() === 'dark') {
        switchTheme('light');
        ctx.setUserPreference('light');
      } else {
        switchTheme('dark');
        ctx.setUserPreference('dark');
      }
    },
  };
}

function getSystemTheme(): EhTheme {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function switchTheme(theme: EhTheme) {
  document.querySelector('html')?.setAttribute('data-theme', theme);
}

function getTheme(): EhTheme {
  const theme =
    document.querySelector('html')?.getAttribute('data-theme') || undefined;
  if (theme === undefined) {
    return getSystemTheme();
  } else if (theme === 'dark') {
    return 'dark';
  } else {
    return 'light';
  }
}

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userPreference, setUserPreference] = useLocalStorage<EhTheme>(
    'theme',
    getTheme(),
  );
  useLayoutEffect(() => {
    switchTheme(userPreference);
  }, []);

  return (
    <ThemeContext.Provider value={{ userPreference, setUserPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
