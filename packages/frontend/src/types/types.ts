/// <reference types="vite-plugin-pwa/client" />

import { RouterHistory } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

export interface EhRouterContext {
  queryClient: QueryClient
  ;
}

export interface EhRouterInitParams {
  history: RouterHistory;
  context: EhRouterContext;
}
