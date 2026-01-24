import express, { Router } from 'express'
import * as trpcExpress from '@trpc/server/adapters/express'
import type { EhMiddlewareOptions, EhMiddlewareResult, MiddlewareContext } from './types'
import { EhDatabaseManager } from './database'
import { createBackendResolver } from './backendResolver'
import { registerFeatures } from './featureRegistry'
import { createTrpcRouter } from '../server/controller'
import { createEhTrpcContext } from '../server/ehTrpcContext'
import { createAuth } from '../modules/auth/auth'

/**
 * Creates a fully-configured env-hopper middleware.
 *
 * @example
 * ```typescript
 * // Simple usage with inline backend
 * const eh = await createEhMiddleware({
 *   basePath: '/api',
 *   database: { url: process.env.DATABASE_URL! },
 *   auth: {
 *     baseURL: 'http://localhost:4000',
 *     secret: process.env.AUTH_SECRET!,
 *   },
 *   backend: {
 *     getBootstrapData: async () => loadStaticData(),
 *     getAvailabilityMatrix: async () => ({}),
 *     getNameMigrations: async () => false,
 *     getResourceJumps: async () => ({ resourceJumps: [], envs: [], lateResolvableParams: [] }),
 *     getResourceJumpsExtended: async () => ({ envs: [] }),
 *   },
 * })
 *
 * app.use(eh.router)
 * await eh.connect()
 * ```
 *
 * @example
 * ```typescript
 * // With DI-resolved backend (e.g., tsyringe)
 * const eh = await createEhMiddleware({
 *   basePath: '/api',
 *   database: {
 *     host: cfg.db.host,
 *     port: cfg.db.port,
 *     database: cfg.db.name,
 *     username: cfg.db.username,
 *     password: cfg.db.password,
 *     schema: cfg.db.schema,
 *   },
 *   auth: {
 *     baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4000',
 *     secret: process.env.BETTER_AUTH_SECRET!,
 *     providers: getAuthProvidersFromEnv(),
 *     plugins: getAuthPluginsFromEnv(),
 *   },
 *   // Factory function - resolved fresh per request from DI container
 *   backend: () => container.resolve(EhBackend),
 *   hooks: {
 *     onRoutesRegistered: (router) => {
 *       router.get('/health', (_, res) => res.send('ok'))
 *     },
 *   },
 * })
 * ```
 */
export async function createEhMiddleware(
  options: EhMiddlewareOptions,
): Promise<EhMiddlewareResult> {
  // Normalize options with defaults
  const basePath = options.basePath ?? '/api'
  const normalizedOptions = { ...options, basePath }

  // Check if database-dependent features are enabled
  const features = options.features ?? {}
  const iconsEnabled = features.icons !== false
  const assetsEnabled = features.assets !== false
  const screenshotsEnabled = features.screenshots !== false
  const legacyIconEnabled = features.legacyIconEndpoint === true
  const needsDatabase = iconsEnabled || assetsEnabled || screenshotsEnabled || legacyIconEnabled

  // Validate database is provided when needed
  if (needsDatabase && !options.database) {
    throw new Error(
      'Database configuration is required when icons, assets, screenshots, or legacyIconEndpoint features are enabled. ' +
        'Either provide database config or disable these features.',
    )
  }

  // Initialize database manager only if database config is provided
  let dbManager: EhDatabaseManager | null = null
  if (options.database) {
    dbManager = new EhDatabaseManager(options.database)
    // Initialize the client (which also sets the global singleton)
    dbManager.getClient()
  }

  // Create auth instance
  const auth = createAuth({
    appName: options.auth.appName,
    baseURL: options.auth.baseURL,
    secret: options.auth.secret,
    providers: options.auth.providers,
    plugins: options.auth.plugins,
    sessionExpiresIn: options.auth.sessionExpiresIn,
    sessionUpdateAge: options.auth.sessionUpdateAge,
  })

  // Create tRPC router
  const trpcRouter = createTrpcRouter(auth)

  // Normalize backend provider to async factory function
  const resolveBackend = createBackendResolver(options.backend)

  // Create tRPC context factory
  const createContext = async () => {
    const companySpecificBackend = await resolveBackend()
    return createEhTrpcContext({ companySpecificBackend })
  }

  // Create Express router
  const router = Router()
  router.use(express.json())

  // Build middleware context for feature registration
  const middlewareContext: MiddlewareContext = {
    auth,
    trpcRouter,
    createContext,
  }

  // Register tRPC middleware (if enabled)
  if (normalizedOptions.features?.trpc !== false) {
    router.use(
      `${basePath}/trpc`,
      trpcExpress.createExpressMiddleware({
        router: trpcRouter,
        createContext,
      }),
    )
  }

  // Register all enabled features
  registerFeatures(router, normalizedOptions, middlewareContext)

  // Call onRoutesRegistered hook if provided
  if (options.hooks?.onRoutesRegistered) {
    await options.hooks.onRoutesRegistered(router)
  }

  return {
    router,
    auth,
    trpcRouter,

    async connect(): Promise<void> {
      if (dbManager) {
        await dbManager.connect()
      }
      if (options.hooks?.onDatabaseConnected) {
        await options.hooks.onDatabaseConnected()
      }
    },

    async disconnect(): Promise<void> {
      if (options.hooks?.onDatabaseDisconnecting) {
        await options.hooks.onDatabaseDisconnecting()
      }
      if (dbManager) {
        await dbManager.disconnect()
      }
    },

    addRoutes(callback: (router: Router) => void): void {
      callback(router)
    },
  }
}
