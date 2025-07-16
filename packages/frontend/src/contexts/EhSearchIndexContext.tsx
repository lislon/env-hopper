import React, { createContext, ReactNode, use, useMemo } from 'react';
import { Index } from 'flexsearch';
import { useEhGlobalContextProps } from './EhConfigContext';

export interface EhSearchIndexContext {
  appPageIndex: Index;
  envIndex: Index;
  userHistorySearchIndex: Index;
  userInteractionsIndex: Index;
}

const EhSearchIndexContext = createContext<EhSearchIndexContext | undefined>(undefined);

interface EhSearchIndexProviderProps {
  children: ReactNode;
}

export function EhSearchIndexProvider({
                                        children
                                      }: EhSearchIndexProviderProps) {
  const { indexData } = useEhGlobalContextProps();

  const value: EhSearchIndexContext = useMemo(() => {
    // Create new envIndex and populate it immediately
    const newEnvIndex = new Index({
      tokenize: 'forward',
      cache: true,
      resolution: 9
    });

    const newAppPageIndex = new Index({
      tokenize: 'forward',
      cache: true,
      resolution: 9
    });

    // Populate the new index
    Object.values(indexData.envs).forEach(env => {
      newEnvIndex.add(env.slug, env.displayName);
    });

    Object.values(indexData.apps).forEach((app: EhBackendAppInputIndexed) => {
      const appKey = `${app.slug}`;
      newAppPageIndex.add(`${appKey}:main`, app.displayName);
      app.aliases?.forEach((alias, index) => {
        newAppPageIndex.add(`${appKey}:alias:${index}`, alias);
      });
      if (app.abbr) {
        newAppPageIndex.add(`${appKey}:abbr`, app.abbr);
      }

      const groups = app.ui?.groups || [];
      for (const group of groups) {
        const groupKey = `${appKey}:ui:${group.slug}`;
        if (groups.length > 1 || group.slug !== 'default') {
          // add group title only if there are multiple groups or it's not the default group
          newAppPageIndex.add(groupKey, group.title);
        }
        for (const page of group.pages) {
          newAppPageIndex.add(`${groupKey}:${page.slug}`, page.title);
        }
      }

    });

    return {
      appPageIndex: newAppPageIndex,
      envIndex: newEnvIndex,
      userHistorySearchIndex: new Index({
        tokenize: 'forward',
        cache: true,
        resolution: 9
      }),
      userInteractionsIndex: new Index({
        tokenize: 'forward',
        cache: true,
        resolution: 9
      })
    };
  }, [indexData]);


  return (
    <EhSearchIndexContext value={value}>
      {children}
    </EhSearchIndexContext>
  );
}

export function useEhSearchIndexContext(): EhSearchIndexContext {
  const context = use(EhSearchIndexContext);
  if (context === undefined) {
    throw new Error('useEhSearchIndexContext must be used within an EhSearchIndexProvider');
  }
  return context;
}
