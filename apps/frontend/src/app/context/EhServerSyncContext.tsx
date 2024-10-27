'use client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { EhClientConfig } from '@env-hopper/types';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface EhServerSyncContext {
  isDegraded: boolean;
  error: Error | null;
  needRefresh: boolean;
  refresh: () => void;
}

const EhServerSyncContext = createContext<EhServerSyncContext | undefined>(
  undefined,
);

export function useEhServerSync(): EhServerSyncContext {
  const ctx = useContext(EhServerSyncContext);
  if (ctx === undefined) {
    throw new Error('EhServerSyncContext is not provided');
  }
  return ctx;
}

export function EhServerSyncContextProvider({
  children,
  config,
  error,
}: {
  children: React.ReactNode;
  config: EhClientConfig | undefined;
  error: Error | null;
}) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
  });

  const refresh = useCallback(() => {
    if (needRefresh) {
      const promise = updateServiceWorker();
      setNeedRefresh(false);
      promise?.then();
    }
  }, [updateServiceWorker, setNeedRefresh, needRefresh]);

  useEffect(() => {
    if (config?.forceRefresh) {
      refresh();
    }
  }, [needRefresh, config?.forceRefresh]);

  const isDegraded = error !== null && config !== undefined;
  const value = { error, isDegraded, needRefresh, refresh };
  return (
    <EhServerSyncContext.Provider value={value}>
      {children}
    </EhServerSyncContext.Provider>
  );
}
