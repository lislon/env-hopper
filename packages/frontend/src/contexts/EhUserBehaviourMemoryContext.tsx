import React, { createContext, ReactNode, use, useCallback, useState } from 'react';
import {
  Action,
  MicroInteraction,
  MicroInteractionContext,
  SearchInteraction,
  SearchSelection
} from '~/types/userBehaviourTypes';
import { useEhGlobalContextProps } from './EhConfigContext';

export interface EhUserBehaviourMemoryContext {
  searchInteractions: SearchInteraction[];
  microInteractions: MicroInteraction[];

  addSearchInteraction: (query: string, selection: SearchSelection) => void;
  addMicroInteraction: (context: MicroInteractionContext, action: Action) => void;

  getSearchInteractions: () => SearchInteraction[];
  getMicroInteractions: () => MicroInteraction[];
}

const EhUserBehaviourMemoryContext = createContext<EhUserBehaviourMemoryContext | undefined>(undefined);

interface EhUserBehaviourMemoryProviderProps {
  children: ReactNode;
}

interface UserHistory {
  searchInteractions?: SearchInteraction[];
  microInteractions?: MicroInteraction[];
}

const clinRevUser: UserHistory = {
    searchInteractions: [
      {
        dateUtcTimestamp: 0,
        query: 'cli',
        selection: {
          type: 'appPage',
          appPageSlug: {
            app: 'clinrev',
            page: 'home'
          }
        }
      }
    ],
    microInteractions: [
      {
        dateUtcTimestamp: 0,
        context: {
          envSlug: 'pspc-tfmrd-01',
          appPageSlug: {
            app: 'lims',
            page: 'home'
          }
        },
        action: {
          actionType: 'appPageSelection',
          appPageSlug: {
            app: 'clinrev',
            page: 'home'
          }
        }
      },
      {
        dateUtcTimestamp: 0,
        context: {
          envSlug: 'pspc-tfmrd-01',
          appPageSlug: {
            app: 'clinrev',
            page: 'home'
          }
        },
        action: {
          actionType: 'pageJump',
          envSlug: 'pspc-tfmrd-01',
          appPageSlug: {
            app: 'clinrev',
            page: 'home'
          }
        }
      },
      {
        dateUtcTimestamp: 0,
        context: {
          envSlug: 'pspc-tfmrd-01',
          appPageSlug: {
            app: 'clinrev',
            page: 'home'
          }
        },
        action: {
          actionType: 'envSelection',
          envSlug: 'staging-1217',
        }
      },
      {
        dateUtcTimestamp: 0,
        context: {
          envSlug: 'staging-1217',
          appPageSlug: {
            app: 'clinrev',
            page: 'home'
          }
        },
        action: {
          actionType: 'pageJump',
          envSlug: 'staging-1217',
          appPageSlug: {
            app: 'clinrev',
            page: 'home'
          }
        }
      },


    ]
  } ;


export function EhUserBehaviourMemoryProvider({
                                                children
                                              }: EhUserBehaviourMemoryProviderProps) {
  const { ehConfig } = useEhGlobalContextProps();
  const [searchInteractions, setSearchInteractions] = useState<SearchInteraction[]>(clinRevUser.searchInteractions || []);
  const [microInteractions, setMicroInteractions] = useState<MicroInteraction[]>(clinRevUser.microInteractions || []);

  const addSearchInteraction = useCallback((query: string, selection: SearchSelection) => {
    const newInteraction: SearchInteraction = {
      dateUtcTimestamp: Date.now(),
      query,
      selection
    };
    setSearchInteractions(prev => {
      const updated = [...prev, newInteraction];
      return updated.slice(-ehConfig.searchHistoryToKeep);
    });
  }, [ehConfig.searchHistoryToKeep]);

  const addMicroInteraction = useCallback((context: MicroInteractionContext, action: Action) => {
    const newInteraction: MicroInteraction = {
      dateUtcTimestamp: Date.now(),
      context,
      action
    };
    setMicroInteractions(prev => {
      const updated = [...prev, newInteraction];
      return updated.slice(-ehConfig.microinteractionsToKeep);
    });
  }, [ehConfig.microinteractionsToKeep]);

  const getSearchInteractions = useCallback(() => {
    return searchInteractions;
  }, [searchInteractions]);

  const getMicroInteractions = useCallback(() => {
    return microInteractions;
  }, [microInteractions]);

  const value: EhUserBehaviourMemoryContext = {
    searchInteractions,
    microInteractions,
    addSearchInteraction,
    addMicroInteraction,
    getSearchInteractions,
    getMicroInteractions
  };

  return (
    <EhUserBehaviourMemoryContext value={value}>
      {children}
    </EhUserBehaviourMemoryContext>
  );
}

export function useEhUserBehaviourMemoryContext(): EhUserBehaviourMemoryContext {
  const context = use(EhUserBehaviourMemoryContext);
  if (context === undefined) {
    throw new Error('useEhUserBehaviourMemoryContext must be used within an EhUserBehaviourMemoryProvider');
  }
  return context;
}
