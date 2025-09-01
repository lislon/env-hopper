'use client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../api/ApiQueryMagazine';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY_VERSION } from '../lib/local-storage-constants';

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
}: {
  children: React.ReactNode;
}) {
  const { data: config, error } = useQuery(ApiQueryMagazine.getConfig());

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

  const [, setVersion] = useLocalStorage<string>(LOCAL_STORAGE_KEY_VERSION, '');
  useEffect(() => {
    if (config?.appVersion) {
      setVersion(config.appVersion);
    }
  }, [config, setVersion]);

  const isDegraded = error !== null && config !== undefined;
  const value = { error, isDegraded, needRefresh, refresh };
  return (
    <EhServerSyncContext.Provider value={value}>
      {children}
    </EhServerSyncContext.Provider>
  );
}
