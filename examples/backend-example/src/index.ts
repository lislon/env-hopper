
import { createEhTrpcContext, trpcRouter } from '@env-hopper/backend-core'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import express from 'express'
import { getRandomAvailabilityMatrix } from './utils.js'
import type { Express } from 'express'
import type {
  BootstrapConfigData,
  EhBackendCompanySpecificBackend,
  RenameRuleParams,
  ResourceJumpsData,
} from '@env-hopper/backend-core'

interface DataShape {
  bootstrapConfigData: BootstrapConfigData
  resourceJumpsData: ResourceJumpsData
}

async function loadStaticData(): Promise<DataShape> {
  try {
    return await import('./local/example-data.local.js')
  } catch (error) {
    console.error(error)
    throw new Error('Failed to load local example data')
  }
}

// created for each request
const createContext = () => {
  const companySpecificBackend: EhBackendCompanySpecificBackend = {
    async getBootstrapData() {
      return (await loadStaticData()).bootstrapConfigData
    },
    async getNameMigrations(params: RenameRuleParams) {
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
      const bootstrapConfigData = (await loadStaticData()).bootstrapConfigData
      return getRandomAvailabilityMatrix({
        apps: Object.values(bootstrapConfigData.apps),
        envs: Object.values(bootstrapConfigData.envs),
      })
    },
    async getResourceJumps() {
      return (await loadStaticData()).resourceJumpsData
    },
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
const port = process.env.PORT || 3002
app.listen(port)
console.log(`Example env-hopper listening on port ${port}`)
export const viteNodeApp: Express = app
