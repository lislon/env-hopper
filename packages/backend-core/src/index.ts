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

export type { AppForCatalog } from './types/common/appCatalogTypes'
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
  getAuthProvidersFromEnv,
  getAuthPluginsFromEnv,
  validateAuthConfig,
} from './modules/auth/authProviders'

export {
  getUserGroups,
  isMemberOfAnyGroup,
  isMemberOfAllGroups,
  getAdminGroupsFromEnv,
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

// Icon management
export {
  registerIconRestController,
  type IconRestControllerConfig,
} from './modules/icons/iconRestController'

export {
  getAssetByName,
  upsertIcon,
  upsertIcons,
  type UpsertIconInput,
} from './modules/icons/iconService'

// Asset management (universal for icons, screenshots, etc.)
export {
  registerAssetRestController,
  type AssetRestControllerConfig,
} from './modules/assets/assetRestController'

export {
  registerScreenshotRestController,
  type ScreenshotRestControllerConfig,
} from './modules/assets/screenshotRestController'

export { createScreenshotRouter } from './modules/assets/screenshotRouter'

export { syncAssets, type SyncAssetsConfig } from './modules/assets/syncAssets'

// App Catalog Admin
export { createAppCatalogAdminRouter } from './modules/appCatalogAdmin/appCatalogAdminRouter'

// Approval Methods
export { createApprovalMethodRouter } from './modules/approvalMethod/approvalMethodRouter'
export {
  syncApprovalMethods,
  type ApprovalMethodSyncInput,
} from './modules/approvalMethod/syncApprovalMethods'

// Database utilities
export {
  connectDb,
  disconnectDb,
  getDbClient,
  setDbClient,
  syncAppCatalog,
  TABLE_SYNC_MAGAZINE,
  tableSyncPrisma,
  type MakeTFromPrismaModel,
  type ObjectKeys,
  type ScalarFilter,
  type ScalarKeys,
  type SyncAppCatalogResult,
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
