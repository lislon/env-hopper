'use client';
import React, { createContext, useContext, useEffect } from 'react';
import { EhClientConfig } from '@env-hopper/types';
import { useQueryClient } from '@tanstack/react-query';
import { persistQueryClientSave } from '@tanstack/react-query-persist-client';
import { persister } from '../api/persister';

export interface EhServerSyncContext {
  isDegraded: boolean;
  error: Error | null;
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
  const queryClient = useQueryClient();
  useEffect(() => {
    if (config?.apps?.length && config?.envs?.length) {
      persistQueryClientSave({
        queryClient,
        persister,
        buster: APP_VERSION,
      }).then();
    }
  }, [queryClient, config]);

  const isDegraded = error !== null && config === undefined;
  return (
    <EhServerSyncContext.Provider value={{ error, isDegraded }}>
      {children}
    </EhServerSyncContext.Provider>
  );
}
