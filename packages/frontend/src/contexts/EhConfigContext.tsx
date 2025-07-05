import React, { createContext, ReactNode, use, useMemo } from 'react';
import { EhIndexData } from '@env-hopper/backend-core';

export interface EhConfigContext {
  indexData: EhIndexData;
}

const EhConfigContext = createContext<EhConfigContext | undefined>(undefined);

interface EhConfigProviderProps {
  children: ReactNode;
  indexData: EhIndexData;
}

export function EhConfigProvider({
  children,
  indexData,
}: EhConfigProviderProps) {
  const value: EhConfigContext = useMemo(() => ({
    indexData,
  }), [indexData]);

  return (
    <EhConfigContext value={value}>
      {children}
    </EhConfigContext>
  );
}

export function useEhGlobalContextProps(): EhConfigContext {
  const context = use(EhConfigContext);
  if (context === undefined) {
    throw new Error("useEhGlobalContextProps must be used within an EhConfigProvider");
  }
  return context;
}
