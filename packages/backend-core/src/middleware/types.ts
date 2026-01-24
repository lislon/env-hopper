import type { Router } from 'express'
import type { LanguageModel, Tool } from 'ai'
import type { BetterAuthOptions, BetterAuthPlugin } from 'better-auth'
import type { EhBackendCompanySpecificBackend } from '../types/backend/companySpecificBackend'
import type { BetterAuth } from '../modules/auth/auth'
import type { TRPCRouter } from '../server/controller'

/**
 * Database connection configuration.
 * Supports both connection URL and structured config.
 */
export type EhDatabaseConfig =
  | { url: string }
  | {
      host: string
      port: number
      database: string
      username: string
      password: string
      schema?: string
    }

/**
 * Auth configuration for Better Auth integration.
 */
export interface EhAuthConfig {
  /** Base URL for auth callbacks (e.g., 'http://localhost:4000') */
  baseURL: string
  /** Secret for signing sessions (min 32 chars in production) */
  secret: string
  /** OAuth providers configuration */
  providers?: BetterAuthOptions['socialProviders']
  /** Additional Better Auth plugins (e.g., Okta) */
  plugins?: Array<BetterAuthPlugin>
  /** Session expiration in seconds (default: 30 days) */
  sessionExpiresIn?: number
  /** Session refresh threshold in seconds (default: 1 day) */
  sessionUpdateAge?: number
  /** Application name shown in auth UI */
  appName?: string
}

/**
 * Admin chat (AI) configuration.
 * When provided, enables the admin/chat endpoint.
 */
export interface EhAdminChatConfig {
  /** AI model instance from @ai-sdk/* packages */
  model: LanguageModel
  /** System prompt for the AI assistant */
  systemPrompt?: string
  /** Custom tools available to the AI */
  tools?: Record<string, Tool>
  /** Validation function called before each request */
  validateConfig?: () => void
}

/**
 * Feature toggles for enabling/disabling specific functionality.
 *
 * Note: Icons, assets, screenshots, and catalog backup are always enabled.
 * Only these optional features can be toggled:
 */
export interface EhFeatureToggles {
  /** Enable tRPC endpoints (default: true) */
  trpc?: boolean
  /** Enable auth endpoints (default: true) */
  auth?: boolean
  /** Enable admin chat endpoint (default: true if adminChat config provided) */
  adminChat?: boolean
  /** Enable legacy icon endpoint at /static/icon/:icon (default: false) */
  legacyIconEndpoint?: boolean
}

/**
 * Company-specific backend can be provided as:
 * 1. Direct object implementing the interface
 * 2. Factory function called per-request (for DI integration)
 * 3. Async factory function
 */
export type EhBackendProvider =
  | EhBackendCompanySpecificBackend
  | (() => EhBackendCompanySpecificBackend)
  | (() => Promise<EhBackendCompanySpecificBackend>)

/**
 * Lifecycle hooks for database and middleware events.
 */
export interface EhLifecycleHooks {
  /** Called after database connection is established */
  onDatabaseConnected?: () => void | Promise<void>
  /** Called before database disconnection (for cleanup) */
  onDatabaseDisconnecting?: () => void | Promise<void>
  /** Called after all routes are registered - use to add custom routes */
  onRoutesRegistered?: (router: Router) => void | Promise<void>
  /** Custom error handler for middleware errors */
  onError?: (error: Error, context: { path: string }) => void
}

/**
 * Main configuration options for the env-hopper middleware.
 */
export interface EhMiddlewareOptions {
  /**
   * Base path prefix for all routes (default: '/api')
   * - tRPC: {basePath}/trpc
   * - Auth: {basePath}/auth (note: auth basePath is hardcoded, this affects where router mounts)
   * - Icons: {basePath}/icons
   * - Assets: {basePath}/assets
   * - Screenshots: {basePath}/screenshots
   * - Admin Chat: {basePath}/admin/chat
   */
  basePath?: string

  /**
   * Database connection configuration (required).
   * Backend-core manages the database for all features.
   */
  database: EhDatabaseConfig

  /** Auth configuration (required) */
  auth: EhAuthConfig

  /** Company-specific backend implementation (required) */
  backend: EhBackendProvider

  /** AI admin chat configuration (optional) */
  adminChat?: EhAdminChatConfig

  /** Feature toggles (all enabled by default) */
  features?: EhFeatureToggles

  /** Lifecycle hooks */
  hooks?: EhLifecycleHooks
}

/**
 * Result of middleware initialization.
 *
 * @example
 * ```typescript
 * const eh = await createEhMiddleware({ ... })
 *
 * // Mount routes
 * app.use(eh.router)
 *
 * // Connect to database
 * await eh.connect()
 *
 * // Cleanup on shutdown
 * process.on('SIGTERM', async () => {
 *   await eh.disconnect()
 * })
 * ```
 */
export interface EhMiddlewareResult {
  /** Express router with all env-hopper routes */
  router: Router
  /** Better Auth instance (for extending auth functionality) */
  auth: BetterAuth
  /** tRPC router (for extending with custom procedures) */
  trpcRouter: TRPCRouter
  /** Connect to database (call during app startup) */
  connect: () => Promise<void>
  /** Disconnect from database (call during app shutdown) */
  disconnect: () => Promise<void>
  /** Add custom routes to the middleware router */
  addRoutes: (callback: (router: Router) => void) => void
}

/**
 * Internal context passed to feature registration functions.
 */
export interface MiddlewareContext {
  auth: BetterAuth
  trpcRouter: TRPCRouter
  createContext: () => Promise<{
    companySpecificBackend: EhBackendCompanySpecificBackend
  }>
}
