import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React, { StrictMode } from 'react';
import { getRoutes } from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const router = createBrowserRouter(getRoutes(queryClient));

export default function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
}
