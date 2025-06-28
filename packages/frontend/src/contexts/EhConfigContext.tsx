import React, { createContext, useContext, ReactNode } from "react";
import { EhEnvDto, EhAppDto } from "~/types/ehTypes";

export interface EhConfigContext {
  listEnvs: EhEnvDto[];
  listApps: EhAppDto[];
}

const EhConfigContext = createContext<EhConfigContext | undefined>(undefined);

interface EhConfigProviderProps {
  children: ReactNode;
  listEnvs: EhEnvDto[];
  listApps: EhAppDto[];
}

export function EhConfigProvider({
  children,
  listEnvs,
  listApps,
}: EhConfigProviderProps) {
  const value: EhConfigContext = {
    listEnvs,
    listApps,
  };

  return (
    <EhConfigContext.Provider value={value}>
      {children}
    </EhConfigContext.Provider>
  );
}

export function useEhGlobalContextProps(): EhConfigContext {
  const context = useContext(EhConfigContext);
  if (context === undefined) {
    throw new Error("useEhGlobalContextProps must be used within an EhConfigProvider");
  }
  return context;
} 