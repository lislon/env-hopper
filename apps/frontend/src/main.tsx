import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { createEhRouter } from './createEhRouter';
import { createBrowserHistory } from '@tanstack/react-router';
import { createQueryClient } from './app/api/createQueryClient';

registerSW();

const queryClient = createQueryClient();
const router = createEhRouter({
  history: createBrowserHistory(),
  context: {
    queryClient: queryClient,
  },
});

// Render the app
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App router={router} queryClient={queryClient} />
    </StrictMode>,
  );
}
