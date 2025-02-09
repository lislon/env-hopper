/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />

import {
  createEhTrpcContext,
  trpcRouter,
  type BootstrapConfigData,
  type EhBackendCompanySpecificBackend,
  type ResourceJumpsData,
} from '@env-hopper/backend-core'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import express from 'express'
import { getRandomAvailabilityMatrix } from './utils.js'

interface DataShape {
  bootstrapConfigData: BootstrapConfigData;
  resourceJumpsData: ResourceJumpsData;
}

async function loadStaticData(): Promise<DataShape> {
        try {
        return await import('./local/example-data.local.js')
      } catch (error) {
        console.error(error)
        return await import('./example-data.js')
      }
}

// created for each request
const createContext = () => {
  const companySpecificBackend: EhBackendCompanySpecificBackend = {
    async getBootstrapData() {
      return (await loadStaticData()).bootstrapConfigData;
    },
    async getNameMigrations(params) {
      const { resourceSlug } = params
      if (resourceSlug?.includes('@')) {
        return {
          type: 'resourceRename',
          oldSlug: resourceSlug,
          targetSlug: resourceSlug.replace('@', '-'),
        }
      }
      return false
    },
    async getAvailabilityMatrix() {
      const bootstrapConfigData = (await loadStaticData()).bootstrapConfigData;
      return getRandomAvailabilityMatrix({
        apps: Object.values(bootstrapConfigData.apps),
        envs: Object.values(bootstrapConfigData.envs),
      })
    },
    async getResourceJumps() {
      return (await loadStaticData()).resourceJumpsData;
    }
  }
  return createEhTrpcContext({
    companySpecificBackend,
  })
}
type Context = Awaited<ReturnType<typeof createContext>>
initTRPC.context<Context>().create()

const app = express()

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: trpcRouter,
    createContext,
  }),
)
if (import.meta.env.PROD) {
  app.listen(4000)
}
export const viteNodeApp = app
