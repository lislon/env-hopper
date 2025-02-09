'use client';
import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type EhTheme = 'dark' | 'light';

export interface HeaderContextValue {
  backButton?: React.ReactNode;
  setBackButton: (backButton: React.ReactNode|undefined) => void;
}

const HeaderContext = createContext<HeaderContextValue | null>(null);

export function useHeader() {
  const ctx = useContext(HeaderContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a HeaderContextProvider');
  }

  return ctx;
}


export function HeaderContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [backButton, setBackButton] = useState<React.ReactNode>(undefined);

  return (
    <HeaderContext.Provider value={{ backButton, setBackButton }}>
      {children}
    </HeaderContext.Provider>
  );
}
