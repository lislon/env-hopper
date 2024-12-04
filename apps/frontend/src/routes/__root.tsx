import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import React from 'react';
import { NotFoundError } from '../app/ui/Error/NotFoundError';
import { LoadingScreen } from '../app/ui/Layout/LoadingScreen';
import { DefaultErrorPage } from '../app/ui/Error/DefaultErrorPage';
import { EhContextProvider } from '../app/context/EhContext';
import { useQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../app/api/ApiQueryMagazine';

export const Route = createRootRoute({
  component: () => {
    if (useQuery(ApiQueryMagazine.getConfig()).isPending) {
      // workaround https://github.com/TanStack/query/issues/8400
      return <LoadingScreen />;
    }

    return (
      <EhContextProvider>
        <Outlet />
        {import.meta.env.MODE === 'dev' ? <TanStackRouterDevtools /> : null}
      </EhContextProvider>
    );
  },
  errorComponent: (errorProps) => <DefaultErrorPage {...errorProps} />,
  notFoundComponent: () => <NotFoundError />,
  pendingComponent: () => <LoadingScreen />,
  wrapInSuspense: true,
});
