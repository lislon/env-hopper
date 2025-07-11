import React, { createContext, ReactNode, use, useCallback, useState } from 'react';
import { EhAppDto, EhBackendPageInputIndexed, EhEnvDto } from '@env-hopper/backend-core';
import { EhAppPage } from '~/types/ehTypes';
import { useEhGlobalContextProps } from './EhConfigContext';

export interface EhUserContext {
  setCurrentEnv: (envSlug: string | undefined) => void;
  setCurrentAppPage: (appSlug: string | undefined, pageSlug: string | undefined) => void;

  currentEnv: EhEnvDto | undefined;
  currentApp: EhAppDto | undefined;
  currentPage: EhAppPage | undefined;
}

const EhUserContext = createContext<EhUserContext | undefined>(undefined);

interface EhUserProviderProps {
  children: ReactNode;
  initialEnvSlug?: string;
  initialAppSlug?: string;
  initialPageSlug?: string;
}

export function EhUserProvider({
  children,
  initialEnvSlug,
  initialAppSlug,
  initialPageSlug,
}: EhUserProviderProps) {
  const { indexData } = useEhGlobalContextProps();

  const [currentEnvSlug, setCurrentEnvSlug] = useState<string | undefined>(initialEnvSlug);
  const [currentAppSlug, setCurrentAppSlug] = useState<string | undefined>(initialAppSlug);
  const [currentPageSlug, setCurrentPageSlug] = useState<string | undefined>(initialPageSlug);

  // Lookup functions
  const findEnvBySlug = useCallback((envSlug: string | undefined): EhEnvDto | undefined => {
    if (!envSlug) return undefined;
    return indexData.envs[envSlug];
  }, [indexData.envs]);

  const findAppBySlug = useCallback((appSlug: string | undefined): EhAppDto | undefined => {
    if (!appSlug) return undefined;
    return indexData.apps[appSlug];
  }, [indexData.apps]);

  const findPageBySlug = useCallback((app: EhAppDto | undefined, pageSlug: string | undefined): EhAppPage | undefined => {
    if (!app || !pageSlug) return undefined;

    // Search through all groups in the app to find the page
    if (app.ui?.groups) {
      for (const group of app.ui.groups) {
        const page = group.pages.find((p: EhBackendPageInputIndexed) => p.slug === pageSlug);
        if (page) {
          return {
            slug: page.slug,
            displayName: page.title || page.slug,
          };
        }
      }
    }
    return undefined;
  }, []);

  // Get current objects from slugs
  const currentEnv = findEnvBySlug(currentEnvSlug);
  const currentApp = findAppBySlug(currentAppSlug);
  const currentPage = findPageBySlug(currentApp, currentPageSlug);

  const setCurrentEnv = useCallback((envSlug: string | undefined) => {
    setCurrentEnvSlug(envSlug);
  }, []);

  const setCurrentAppPage = useCallback((appSlug: string | undefined, pageSlug: string | undefined) => {
    setCurrentAppSlug(appSlug);
    setCurrentPageSlug(pageSlug);
  }, []);

  const value: EhUserContext = {
    setCurrentEnv,
    setCurrentAppPage,
    currentEnv,
    currentApp,
    currentPage,
  };

  return (
    <EhUserContext value={value}>
      {children}
    </EhUserContext>
  );
}

export function useEhUserContext(): EhUserContext {
  const context = use(EhUserContext);
  if (context === undefined) {
    throw new Error("useEhUserContext must be used within an EhUserProvider");
  }
  return context;
}
