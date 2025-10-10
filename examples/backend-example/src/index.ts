import { config as loadEnv } from 'dotenv-defaults'

import express from 'express'

import { openai } from '@ai-sdk/openai'
import {
  DEFAULT_ADMIN_SYSTEM_PROMPT,
  createAdminChatHandler,
  createAuth,
  createDatabaseTools,
  createEhTrpcContext,
  createTrpcRouter,
  getAssetByName,
  registerAssetRestController,
  registerAuthRoutes,
  registerIconRestController,
  registerScreenshotRestController,
  staticControllerContract,
} from '@env-hopper/backend-core'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { getAuthProviders, validateAuthConfig } from './config/authProviders.js'
import { getRandomAvailabilityMatrix } from './utils.js'

import type { Express, Request, Response } from 'express'

import type {
  BootstrapConfigData,
  EhBackendCompanySpecificBackend,
  RenameRuleParams,
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '@env-hopper/backend-core'

loadEnv()

// Validate and get auth configuration
validateAuthConfig()
const authProviders = getAuthProviders()

// Initialize better-auth (uses internal Prisma client from backend-core)
const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4000',
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'dev-secret-change-in-production-minimum-32-chars!',
  providers: authProviders,
  // Sessions now persist for 30 days instead of 7 days
  sessionExpiresIn: 60 * 60 * 24 * 30, // 30 days
  sessionUpdateAge: 60 * 60 * 24, // Refresh after 1 day
})

interface DataShape {
  bootstrapConfigData: BootstrapConfigData
  resourceJumpsData: ResourceJumpsData
  resourceJumpsDataExtended: ResourceJumpsExtendedData
}

async function loadStaticData(): Promise<DataShape> {
  try {
    // Try to load local override first, fallback to example data
    return await import('./local/example-data.local.js')
  } catch (error) {
    // Use the clean example data as fallback
    return {
      bootstrapConfigData: {
        envs: {},
        apps: {},
        appsMeta: {
          tags: {
            descriptions: [],
          },
        },
        contexts: [],
        defaults: {
          envSlug: '',
          resourceJumpSlug: '',
        },
      },
      resourceJumpsData: {
        envs: [],
        lateResolvableParams: [],
        resourceJumps: [],
      },
      resourceJumpsDataExtended: {
        envs: [],
      },
    }
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
      const newLocal = await loadStaticData()
      return newLocal.resourceJumpsData
    },
    async getResourceJumpsExtended() {
      const newLocal = await loadStaticData()
      return newLocal.resourceJumpsDataExtended
    },
  }
  return createEhTrpcContext({
    companySpecificBackend,
  })
}
type Context = Awaited<ReturnType<typeof createContext>>
initTRPC.context<Context>().create()

// Create tRPC router with auth instance for provider discovery
const trpcRouter = createTrpcRouter(auth)

const app = express()

// Parse JSON bodies
app.use(express.json())

// Register auth routes with better-auth
registerAuthRoutes(app, auth)

// Register universal asset REST endpoints (for icons, screenshots, etc.)
registerAssetRestController(app, { basePath: '/api/assets' })

// Register icon REST endpoints BEFORE tRPC
registerIconRestController(app, { basePath: '/api/icons' })

// Register screenshot REST endpoints
registerScreenshotRestController(app, { basePath: '/api/screenshots' })

// Create database tools for the AI (generic access to any table)
const databaseTools = createDatabaseTools()

// Admin chat endpoint (AI-powered admin interface)
app.post(
  '/api/admin/chat',
  createAdminChatHandler({
    // Use .chat() to use Chat Completions API (not Responses API) - avoids ZDR item persistence issues
    model: openai.chat('gpt-4o-mini'),
    systemPrompt: DEFAULT_ADMIN_SYSTEM_PROMPT,
    tools: databaseTools,
    validateConfig: () => {
      if (!process.env['OPENAI_API_KEY']) {
        throw new Error('OPENAI_API_KEY environment variable is not configured')
      }
    },
  }),
)

// Serve app icons from database (via the icon REST controller)
// This endpoint redirects to the actual icon endpoint for backwards compatibility
app.get(
  `/${staticControllerContract.methods.getIcon.url}`,
  async (req: Request<{ icon: string }>, res: Response) => {
    const { icon } = req.params

    if (!icon || !/^[a-z0-9-]+$/i.test(icon)) {
      res.status(400).send('Invalid icon name')
      return
    }

    try {
      // Query the database for the icon using backend-core helper
      const dbIcon = await getAssetByName(icon)

      if (!dbIcon) {
        res.status(404).send('Icon not found')
        return
      }

      // Set appropriate headers
      res.setHeader('Content-Type', dbIcon.mimeType)
      res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day
      res.send(dbIcon.content)
    } catch (error) {
      console.error('Error fetching icon:', error)
      res.status(404).send('Icon not found')
    }
  },
)

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: trpcRouter,
    createContext,
  }),
)

const port = process.env.PORT || 4001
app.listen(port)
console.log(`Example env-hopper listening on port ${port}`)
export const viteNodeApp: Express = app
