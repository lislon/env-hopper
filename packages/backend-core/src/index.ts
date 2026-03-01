// common

export { createTrpcRouter } from './server/controller'
export type { TRPCRouter } from './server/controller'
export { createEhTrpcContext } from './server/ehTrpcContext'
export type {
  EhTrpcContext,
  EhTrpcContextOptions,
} from './server/ehTrpcContext'

export { staticControllerContract } from './server/ehStaticControllerContract'
export type { EhStaticControllerContract } from './server/ehStaticControllerContract'

// ui-only

// backend-only

export * from './types/index'

// Auth
export {
  createAuth,
  type AuthConfig,
  type BetterAuth,
} from './modules/auth/auth'

export { registerAuthRoutes } from './modules/auth/registerAuthRoutes'

export { createAuthRouter, type AuthRouter } from './modules/auth/authRouter'

export {
  getUserGroups,
  isMemberOfAnyGroup,
  isMemberOfAllGroups,
  isAdmin,
  requireAdmin,
  requireGroups,
  type UserWithGroups,
} from './modules/auth/authorizationUtils'

// Admin
export {
  createAdminChatHandler,
  tool,
  type AdminChatHandlerOptions,
} from './modules/admin/chat/createAdminChatHandler'

export {
  createDatabaseTools,
  createPrismaDatabaseClient,
  DEFAULT_ADMIN_SYSTEM_PROMPT,
  type DatabaseClient,
} from './modules/admin/chat/createDatabaseTools'

// Database utilities
export {
  connectDb,
  disconnectDb,
  getDbClient,
  setDbClient,
  TABLE_SYNC_MAGAZINE,
  tableSyncPrisma,
  type MakeTFromPrismaModel,
  type ObjectKeys,
  type ScalarFilter,
  type ScalarKeys,
  type TableSyncMagazine,
  type TableSyncMagazineModelNameKey,
  type TableSyncParamsPrisma,
} from './db'

// Middleware (batteries-included backend setup)
export {
  createEhMiddleware,
  EhDatabaseManager,
  type EhDatabaseConfig,
  type EhAuthConfig,
  type EhAdminChatConfig,
  type EhFeatureToggles,
  type EhBackendProvider,
  type EhLifecycleHooks,
  type EhMiddlewareOptions,
  type EhMiddlewareResult,
  type MiddlewareContext,
} from './middleware'
