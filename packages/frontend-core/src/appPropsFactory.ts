import type { TRPCRouter } from '@env-hopper/backend-core'
import { createBrowserHistory } from '@tanstack/react-router'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createQueryClient } from '~/api/infra/createQueryClient'
import { createEhRouter } from '~/util/createEhRouter'
import type { AppProps } from './App'
import type { EhPlugin } from './modules/pluginCore/types'
import { PageUrlJumpPlugin } from './plugins/builtin/pageUrl/pageUrlJumpPlugin'
import { EhDb } from './userDb/EhDb'

// registerSW();
export function appPropsFactory(): AppProps {
  const trpcClient = createTRPCClient<TRPCRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:4000/trpc',
      }),
    ],
  })

  const db = new EhDb()
  const queryClient = createQueryClient({ trpcClient })
  const plugins: Array<EhPlugin> = [new PageUrlJumpPlugin()]
  const router = createEhRouter({
    history: createBrowserHistory(),
    context: {
      queryClient,
      trpcClient,
      db,
      plugins,
    },
  })

  return { router, queryClient, trpcClient, db }
}
