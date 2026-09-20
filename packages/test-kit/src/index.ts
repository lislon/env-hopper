/**
 * Integration test harness for Env Hopper.
 *
 * `renderApp(...)` mounts the real `App` against a mock backend and hands back
 * page objects (`ui.resourceJump`, ...) to drive it with. Consumers supply
 * `vitest`, `jsdom` and the setup file:
 *
 *   // vite.config.ts
 *   test: {
 *     environment: 'jsdom',
 *     setupFiles: ['@env-hopper/test-kit/setup'],
 *   }
 *
 * Add `'@env-hopper/test-kit/cucumber'` as a second setup file and the
 * `quickpickle()` plugin to reuse the step definitions against your own
 * fixtures — see `registerCatalog`.
 */
export { cleanupTestResources, renderApp } from './harness/renderApp'
export type { AppHandle, RenderAppOptions } from './harness/renderApp'
export { createDeferred } from './harness/deferred'
export type { Deferred } from './harness/deferred'

export {
  TRPC_URL,
  createApp,
  createBackend,
  createEnv,
} from './mock-backend/createBackend'
export type {
  BackendData,
  Fixture,
  FixtureApp,
  FixtureEnv,
  MockBackend,
  OverrideBackendNetworkFn,
  ResourceJumpType,
} from './mock-backend/createBackend'

export { BackendMagazine, DbMagazine, magazine } from './mock-backend/magazines'
export type { DbMagazineInstance } from './mock-backend/magazines'

export { createResourceJumpUi } from './tools/ResourceJumpTools'
