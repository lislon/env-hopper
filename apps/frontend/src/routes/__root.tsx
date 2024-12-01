import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import React from 'react';
import { NotFoundError } from '../app/ui/Error/NotFoundError';
import { LoadingScreen } from '../app/ui/Layout/LoadingScreen';
import { Layout } from '../app/ui/Layout/Layout';
import { DefaultErrorPage } from '../app/ui/Error/DefaultErrorPage';
import { EhGeneralContextProvider } from '../app/context/EhContext';

export const Route = createRootRoute({
  component: () => {
    return (
      <EhGeneralContextProvider>
        <Layout>
          <Outlet />
          {import.meta.env.MODE === 'dev' ? <TanStackRouterDevtools /> : null}
        </Layout>
      </EhGeneralContextProvider>
    );
  },
  errorComponent: (errorProps) => <DefaultErrorPage {...errorProps} />,
  notFoundComponent: () => <NotFoundError />,
  pendingComponent: () => <LoadingScreen />,
  wrapInSuspense: true,
});
