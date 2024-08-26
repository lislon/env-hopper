import { Home } from './ui/Home';
import { Layout } from './ui/Layout';
import React from 'react';
import { DefaultErrorPage } from './ui/Error/DefaultErrorPage';
import { NotFoundError } from './ui/Error/NotFoundError';
import { EhMainLoaderData } from './types';
import { defer, Outlet } from 'react-router-dom';
import { getConfig } from './api';

const loader = async () => {
  return defer({
    config: getConfig(),
  } satisfies EhMainLoaderData);
};
export const routes = [
  {
    id: 'root',
    path: '/',
    element: <Layout children={<Outlet />} />,
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
