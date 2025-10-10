import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
// import { registerSW } from 'virtual:pwa-register';
import type { TRPCRouter } from '@env-hopper/backend-core'
import { createBrowserHistory } from '@tanstack/react-router'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createQueryClient } from '~/api/infra/createQueryClient'
import { App } from '~/App'
import { createEhRouter } from '~/util/createEhRouter'
import './index.css'
import type { EhPlugin } from './modules/pluginCore/types'
import { EhDb as DbClass } from './userDb/EhDb'

// registerSW();

const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc',
    }),
  ],
})

const db = new DbClass()
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
    boostrapHealth: {
      bootstrapApiError: undefined,
    },
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
