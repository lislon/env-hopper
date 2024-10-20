import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React, { StrictMode } from 'react';
import { getRoutes } from './routes';
import { createQueryClient } from './api/createQueryClient';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { persister } from './api/persister';
import { EhServerSyncContextProvider } from './context/EhServerSyncContext';
import { useQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from './api/ApiQueryMagazine';

const queryClient = createQueryClient();
const router = createBrowserRouter(getRoutes());

function WithinQueryProvider() {
  const { error, data: config } = useQuery(ApiQueryMagazine.getConfig());

  return (
    <EhServerSyncContextProvider config={config} error={error}>
      <RouterProvider router={router} />
    </EhServerSyncContextProvider>
  );
}

export default function App() {
  return (
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, buster: import.meta.env.VITE_APP_VERSION }}
      >
        <WithinQueryProvider />
      </PersistQueryClientProvider>
    </StrictMode>
  );
}
