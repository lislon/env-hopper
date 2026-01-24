import { config as loadEnv } from 'dotenv-defaults'
import express from 'express'
import { openai } from '@ai-sdk/openai'
import {
  DEFAULT_ADMIN_SYSTEM_PROMPT,
  createDatabaseTools,
  createEhMiddleware,
  getAssetByName,
  staticControllerContract,
} from '@env-hopper/backend-core'
import type { Express, Request, Response } from 'express'
import type {
  BootstrapConfigData,
  EhBackendCompanySpecificBackend,
  RenameRuleParams,
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '@env-hopper/backend-core'
import { getAuthProviders, validateAuthConfig } from './config/authProviders.js'
import { getRandomAvailabilityMatrix } from './utils.js'

loadEnv()

// Validate auth configuration
validateAuthConfig()

interface DataShape {
  bootstrapConfigData: BootstrapConfigData
  resourceJumpsData: ResourceJumpsData
  resourceJumpsDataExtended: ResourceJumpsExtendedData
}

async function loadStaticData(): Promise<DataShape> {
  try {
    // Try to load local override first, fallback to example data
    return await import('./local/example-data.local.js')
  } catch {
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

// Company-specific backend implementation
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
  async getResourceJumpsExtended() {
    return (await loadStaticData()).resourceJumpsDataExtended
  },
}

// Create the middleware with all configuration
const eh = await createEhMiddleware({
  basePath: '/api',

  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },

  auth: {
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4000',
    secret:
      process.env.BETTER_AUTH_SECRET ||
      'dev-secret-change-in-production-minimum-32-chars!',
    providers: getAuthProviders(),
    sessionExpiresIn: 60 * 60 * 24 * 30, // 30 days
    sessionUpdateAge: 60 * 60 * 24, // Refresh after 1 day
  },

  backend: companySpecificBackend,

  adminChat: {
    model: openai.chat('gpt-4o-mini'),
    systemPrompt: DEFAULT_ADMIN_SYSTEM_PROMPT,
    tools: createDatabaseTools(),
    validateConfig: () => {
      if (!process.env['OPENAI_API_KEY']) {
        throw new Error('OPENAI_API_KEY environment variable is not configured')
      }
    },
  },

  features: {
    legacyIconEndpoint: true, // Enable /static/icon/:icon
  },

  hooks: {
    onRoutesRegistered: (router) => {
      // Legacy icon endpoint at /icon/:icon (for backwards compatibility)
      router.get(
        `/${staticControllerContract.methods.getIcon.url}`,
        async (req: Request<{ icon: string }>, res: Response) => {
          const { icon } = req.params

          if (!icon || !/^[a-z0-9-]+$/i.test(icon)) {
            res.status(400).send('Invalid icon name')
            return
          }

          try {
            const dbIcon = await getAssetByName(icon)

            if (!dbIcon) {
              res.status(404).send('Icon not found')
              return
            }

            res.setHeader('Content-Type', dbIcon.mimeType)
            res.setHeader('Cache-Control', 'public, max-age=86400')
            res.send(dbIcon.content)
          } catch (error) {
            console.error('Error fetching icon:', error)
            res.status(404).send('Icon not found')
          }
        },
      )

      // Backwards compatibility: mount tRPC at /trpc (in addition to /api/trpc)
      // This allows existing frontends to work without changes
      router.use('/trpc', (req, _res, next) => {
        // Rewrite the URL to /api/trpc and let Express handle it
        req.url = `/api/trpc${req.url}`
        next('route')
      })
    },
  },
})

const app = express()

// Mount the middleware
app.use(eh.router)

// Connect and start
await eh.connect()
const port = process.env.PORT || 4001
app.listen(port)
console.log(`Example env-hopper listening on port ${port}`)

export const viteNodeApp: Express = app
