import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { App } from '@/App';
import { createQueryClient } from '@/api/infra/createQueryClient';
import { createEhRouter } from '@/util/createEhRouter';
import { createBrowserHistory } from '@tanstack/react-router';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { TRPCRouter } from '@env-hopper/backend-core/src';

registerSW();

const queryClient = createQueryClient();
const router = createEhRouter({
  history: createBrowserHistory(),
  context: {
    queryClient: queryClient
  }
});


const trpcClient = createTRPCClient<TRPCRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:3002'
      })
    ]
  }
);


setupApollo().then(client => {
// Render the app
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rootElement = document.getElementById('root')!;
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App router={router} queryClient={queryClient} trpcClient={trpcClient} />
    </React.StrictMode>
  );
});
