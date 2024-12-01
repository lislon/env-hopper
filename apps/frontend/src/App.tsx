import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { QueryClient } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { persister } from './app/api/persister';
import { createEhRouter } from './createEhRouter';
import { EhServerSyncContextProvider } from './app/context/EhServerSyncContext';

export interface AppProps {
  router: ReturnType<typeof createEhRouter>;
  queryClient: QueryClient;
}

export function App({ router, queryClient }: AppProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, buster: import.meta.env.VITE_APP_VERSION }}
    >
      <EhServerSyncContextProvider>
        <RouterProvider router={router} />
      </EhServerSyncContextProvider>
    </PersistQueryClientProvider>
  );
}
