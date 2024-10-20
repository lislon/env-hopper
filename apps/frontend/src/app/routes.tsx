import { Home } from './ui/Home';
import React from 'react';
import { DefaultErrorPage } from './ui/Error/DefaultErrorPage';
import { NotFoundError } from './ui/Error/NotFoundError';

export function getRoutes() {
  return [
    {
      id: 'root',
      path: '/',
      errorElement: <DefaultErrorPage />,
      // loader,
      children: [
        ...[
          '',
          'env/:envId',
          'app/:appId',
          'env/:envId/app/:appId',
          'env/:envId/app/:appId/sub/:subValue',
          'app/:appId/sub/:subValue',
          'env/:envId/sub/:subValue',
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
