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
import { createMockUserFromDevConfig } from '../modules/auth/devMockUserUtils'

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

  // Get admin groups from config with default
  const adminGroups = options.auth.adminGroups ?? ['env_hopper_ui_super_admins']

  // Create tRPC context factory
  const createContext = async ({
    req,
  }: trpcExpress.CreateExpressContextOptions) => {
    const companySpecificBackend = await resolveBackend()

    let user = null
    let userGroups: Array<string> = []

    // Check if dev mock user is configured
    if (options.auth.devMockUser) {
      user = createMockUserFromDevConfig(options.auth.devMockUser)
      userGroups = options.auth.devMockUser.groups
    } else {
      // Extract user from session
      try {
        const session = await auth.api.getSession({
          headers: req.headers as HeadersInit,
        })
        user = session?.user ?? null

        // If user is authenticated and Okta is configured, decode groups from access token
        if (user && options.auth.oktaGroupsClaim) {
          try {
            // Get the current access token (auto-refreshes if expired)
            // Note: better-auth requires providerId, but we use 'okta' as default
            const tokenResult = await auth.api.getAccessToken({
              body: {
                providerId: 'okta',
              },
              headers: req.headers as HeadersInit,
            })

            if (tokenResult.accessToken) {
              // Decode JWT to extract groups claim
              const parts = tokenResult.accessToken.split('.')
              if (parts.length === 3 && parts[1]) {
                const payload = JSON.parse(
                  Buffer.from(parts[1], 'base64').toString(),
                )
                const groups = payload[options.auth.oktaGroupsClaim]
                userGroups = Array.isArray(groups) ? groups : []
              }
            }
          } catch (error) {
            console.error('[tRPC Context] Failed to get access token:', error)
          }
        }
      } catch (error) {
        console.error('[tRPC Context] Failed to get session:', error)
      }
    }

    // Attach groups to user object for authorization checks
    const userWithGroups = user ? { ...user, groups: userGroups } : null

    return createEhTrpcContext({
      companySpecificBackend,
      user: userWithGroups,
      adminGroups,
    })
  }

  // Create Express router
  const router = Router()
  router.use(express.json())

  // Build middleware context for feature registration
  const middlewareContext: MiddlewareContext = {
    auth,
    trpcRouter,
    createContext: async () => {
      const companySpecificBackend = await resolveBackend()
      return createEhTrpcContext({
        companySpecificBackend,
        adminGroups,
      })
    },
    authConfig: options.auth,
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
