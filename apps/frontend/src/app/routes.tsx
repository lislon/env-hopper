import { Home } from './ui/Home';
import { Layout } from './ui/Layout';
import React from 'react';
import { DefaultErrorPage } from './ui/Error/DefaultErrorPage';
import { NotFoundError } from './ui/Error/NotFoundError';
import {
  defer,
  LoaderFunction,
  Outlet,
  redirect,
  RouteObject,
} from 'react-router-dom';
import { getConfig } from './api';
import { LOCAL_STORAGE_KEY_LAST_SELECTED } from './lib/local-storage-keys';
import { localStorageGet } from './hooks/useLocalStorage';
import { LastSelected } from '@env-hopper/types';
import { getAppById, getEnvById, getUrlBasedOn } from './context/EhContext';

const loader: LoaderFunction = async (ctx) => {
  if (Object.keys(ctx.params).length === 0) {
    const lastSelected = localStorageGet<LastSelected | null>(
      LOCAL_STORAGE_KEY_LAST_SELECTED,
      null,
    );
    if (lastSelected !== null) {
      const config = await getConfig();

      const foundApp = getAppById(lastSelected.appId, config.apps);
      const foundEnv = getEnvById(lastSelected.envId, config.envs);
      if (foundApp || foundEnv) {
        return redirect(
          getUrlBasedOn(foundEnv?.id, foundApp?.id, lastSelected.subValue),
        );
      }

      return defer({
        config,
      });
    }
  }

  return defer({
    config: await getConfig(),
  });
};
export const routes: RouteObject[] = [
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
