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
