import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
// import { registerSW } from 'virtual:pwa-register';
import { createBrowserHistory } from '@tanstack/react-router'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { EhDb as DbClass } from './userDb/EhDb'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { EhPlugin } from './modules/pluginCore/types'
import { createQueryClient } from '~/api/infra/createQueryClient'
import { App } from '~/App'
import { createEhRouter } from '~/util/createEhRouter'
import './index.css'

// registerSW();

const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchLink({
      // Relative by default so the request stays same-origin and the dev
      // server's `/api` proxy forwards it. An absolute default sends the
      // browser cross-origin and CORS blocks it whenever the api is not on
      // the port the frontend guessed.
      url: import.meta.env.VITE_EH_API_URL ?? '/api/trpc',
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
