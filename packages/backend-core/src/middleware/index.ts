/**
 * Middleware module for env-hopper backend integration.
 *
 * Provides a batteries-included middleware factory that handles all backend wiring:
 * - Database connection management
 * - Authentication setup
 * - tRPC router configuration
 * - Feature registration (icons, assets, screenshots, admin chat)
 *
 * @example
 * ```typescript
 * const eh = await createEhMiddleware({
 *   basePath: '/api',
 *   database: { host, port, database, username, password, schema },
 *   auth: { baseURL, secret, providers },
 *   backend: myBackendImplementation,
 * })
 *
 * app.use(eh.router)
 * await eh.connect()
 * ```
 *
 * @module middleware
 */

// Main middleware factory
export { createEhMiddleware } from './createEhMiddleware'

// Types
export type {
  EhDatabaseConfig,
  EhAuthConfig,
  EhAdminChatConfig,
  EhFeatureToggles,
  EhBackendProvider,
  EhLifecycleHooks,
  EhMiddlewareOptions,
  EhMiddlewareResult,
  MiddlewareContext,
} from './types'

// Database manager (for advanced use cases)
export { EhDatabaseManager } from './database'
