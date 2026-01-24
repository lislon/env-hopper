import express, { Router } from 'express'
import * as trpcExpress from '@trpc/server/adapters/express'
import type {
  EhMiddlewareOptions,
  EhMiddlewareResult,
  MiddlewareContext,
} from './types'
import { EhDatabaseManager } from './database'
import { createBackendResolver } from './backendResolver'
import { registerFeatures } from './featureRegistry'
import { createTrpcRouter } from '../server/controller'
import { createEhTrpcContext } from '../server/ehTrpcContext'
import { createAuth } from '../modules/auth/auth'

export async function createEhMiddleware(
  options: EhMiddlewareOptions,
): Promise<EhMiddlewareResult> {
  // Normalize options with defaults
  const basePath = options.basePath ?? '/api'
  const normalizedOptions = { ...options, basePath }

  // Initialize database manager
  const dbManager = new EhDatabaseManager(options.database)
  // Initialize the client (which also sets the global singleton)
  dbManager.getClient()

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
      await dbManager.connect()
      if (options.hooks?.onDatabaseConnected) {
        await options.hooks.onDatabaseConnected()
      }
    },

    async disconnect(): Promise<void> {
      if (options.hooks?.onDatabaseDisconnecting) {
        await options.hooks.onDatabaseDisconnecting()
      }
      await dbManager.disconnect()
    },

    addRoutes(callback: (router: Router) => void): void {
      callback(router)
    },
  }
}
