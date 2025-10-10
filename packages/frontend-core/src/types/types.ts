/// <reference types="vite-plugin-pwa/client" />

import type { RouterHistory } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { TRPCClient } from '@trpc/client'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { EhDb } from '~/userDb/EhDb'
import type { EhPlugin } from '~/modules/pluginCore/types'
import type {EnvHopperHealthStateBootstrapPart} from "~/modules/config/HealthStateContext";

export interface EhRouterContext {
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
  db: EhDb
  plugins: Array<EhPlugin>
  boostrapHealth: EnvHopperHealthStateBootstrapPart;
}

export interface EhRouterInitParams {
  history: RouterHistory
  context: EhRouterContext
}
