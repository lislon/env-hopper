import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createEhRouter } from '~/util/createEhRouter';
import { RouterProvider } from '@tanstack/react-router';
import { TRPCProvider } from '~/api/infra/trpc';
import { TRPCClient } from '@trpc/client';
import { TRPCRouter } from '@env-hopper/backend-core';

export interface AppProps {
  router: ReturnType<typeof createEhRouter>;
  queryClient: QueryClient;
  trpcClient: TRPCClient<TRPCRouter>;
}

export function App({ router, queryClient, trpcClient }: AppProps) {
  return (
    <QueryClientProvider
      client={queryClient}
    >
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <RouterProvider router={router} />
      </TRPCProvider>
    </QueryClientProvider>
  );
}
