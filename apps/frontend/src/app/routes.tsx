import { Home } from './ui/Home';
import React from 'react';
import { DefaultErrorPage } from './ui/Error/DefaultErrorPage';
import { NotFoundError } from './ui/Error/NotFoundError';
import { EhMainLoaderData } from './types';
import { defer } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { ApiQueryMagazine } from './api/ApiQueryMagazine';

export function getRoutes(queryClient: QueryClient) {
  const loader = async () => {
    const config = queryClient.fetchQuery(ApiQueryMagazine.getConfig());
    const customization = queryClient.fetchQuery(
      ApiQueryMagazine.getCustomization(),
    );

    return defer({
      config,
      customization,
    } satisfies EhMainLoaderData);
  };

  return [
    {
      id: 'root',
      path: '/',
      errorElement: <DefaultErrorPage />,
      loader,
      children: [
        ...[
          '',
          'env/:envId',
          'app/:appId',
          'env/:envId/app/:appId',
          'env/:envId/app/:appId/sub/:subValue',
          'app/:appId/sub/:subValue',
        ].map((path) => ({
          path,
          element: <Home />,
        })),
        {
          path: '*',
          element: <NotFoundError />,
        },
      ],
    },
  ];
}
