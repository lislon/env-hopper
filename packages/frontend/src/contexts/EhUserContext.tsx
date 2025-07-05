import React, { createContext, useContext, useState, ReactNode } from "react";
import { EhEnvDto, EhAppDto } from "@env-hopper/backend-core";
import { EhAppPage } from "~/types/ehTypes";

export interface EhUserContext {
  setEnv: (env: EhEnvDto | undefined) => void;
  setApp: (app: EhAppDto | undefined) => void;
  setPage: (page: EhAppPage | undefined) => void;

  env: EhEnvDto | undefined;
  app: EhAppDto | undefined;
  page: EhAppPage | undefined;
}

const EhUserContext = createContext<EhUserContext | undefined>(undefined);

interface EhUserProviderProps {
  children: ReactNode;
  initialEnv?: EhEnvDto;
  initialApp?: EhAppDto;
  initialPage?: EhAppPage;
}

export function EhUserProvider({
  children,
  initialEnv,
  initialApp,
  initialPage,
}: EhUserProviderProps) {
  const [env, setEnv] = useState<EhEnvDto | undefined>(initialEnv);
  const [app, setApp] = useState<EhAppDto | undefined>(initialApp);
  const [page, setPage] = useState<EhAppPage | undefined>(initialPage);

  const value: EhUserContext = {
    setEnv,
    setApp,
    setPage,
    env,
    app,
    page,
  };

  return (
    <EhUserContext.Provider value={value}>
      {children}
    </EhUserContext.Provider>
  );
}

export function useEhUserContext(): EhUserContext {
  const context = useContext(EhUserContext);
  if (context === undefined) {
    throw new Error("useEhUserContext must be used within an EhUserProvider");
  }
  return context;
} 