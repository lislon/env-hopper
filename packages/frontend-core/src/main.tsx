import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
// import { registerSW } from 'virtual:pwa-register';
import './index.css'
import { createBrowserHistory } from '@tanstack/react-router'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { EhDb as DbClass } from './userDb/EhDb'
import { PageUrlJumpPlugin } from './plugins/builtin/pageUrl/pageUrlJumpPlugin'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { EhPlugin } from './modules/pluginCore/types'
import { createEhRouter } from '~/util/createEhRouter'
import { createQueryClient } from '~/api/infra/createQueryClient'
import { App } from '~/App'

// registerSW();

const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc',
    }),
  ],
})

const db = new DbClass()
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

// Render the app

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App
        router={router}
        queryClient={queryClient}
        trpcClient={trpcClient}
        db={db}
      />
    </StrictMode>,
  )
}
