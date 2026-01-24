import { createBrowserHistory } from '@tanstack/react-router'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { EhDb } from './userDb/EhDb'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { AppProps } from './App'
import type { EhPlugin } from './modules/pluginCore/types'
import { createQueryClient } from '~/api/infra/createQueryClient'
import { createEhRouter } from '~/util/createEhRouter'

// registerSW();
export function appPropsFactory(): AppProps {
  const trpcClient = createTRPCClient<TRPCRouter>({
    links: [
      httpBatchLink({
        url: `${window.location.origin}/api/trpc`,
      }),
    ],
  })

  const db = new EhDb()
  const queryClient = createQueryClient({ trpcClient, db })
  const plugins: Array<EhPlugin> = [
    // Future plugins can be added here
  ]
  const router = createEhRouter({
    history: createBrowserHistory(),
    context: {
      queryClient,
      trpcClient,
      db,
      plugins,
      boostrapHealth: {},
    },
  })

  return { router, queryClient, trpcClient, db }
}
