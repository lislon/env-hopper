/**
 * Internals the test kit mounts the app with. Reachable as
 * `@env-hopper/frontend-core/internal` — deliberately kept out of the package's
 * main entry so the public API stays the `App` component.
 *
 * No stability guarantees: this moves in lockstep with
 * `@env-hopper/test-kit`, which is its only intended consumer.
 */
export { App } from './App'
export type { AppProps } from './App'
export { EhDb, dbCacheDbKeys } from './userDb/EhDb'
export { createEhRouter } from './util/createEhRouter'
export { createQueryClient } from './api/infra/createQueryClient'
