import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React, { StrictMode } from 'react';
import { getRoutes } from './routes';
import { createQueryClient } from './api/createQueryClient';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { persister } from './api/persister';

const queryClient = createQueryClient();
const router = createBrowserRouter(getRoutes());

export default function App() {
  return (
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, buster: APP_VERSION }}
      >
        <RouterProvider router={router} />
      </PersistQueryClientProvider>
    </StrictMode>
  );
}
