import { createBackend } from './createBackend'
import type { Fixture, MockBackend } from './createBackend'
import type { EhDb } from '@env-hopper/frontend-core/internal'

/**
 * Named fixtures. Invented sample data only — a kit that shipped somebody's real
 * environment list would be a kit nobody outside that company could read.
 */
export const magazine = {
  /** Three envs, three apps, deliberately unremarkable. The default backend. */
  default: (): Fixture => ({
    apps: [
      { slug: 'app1', resourceJumps: '2-pager' },
      { slug: 'app2', resourceJumps: '1-pager' },
      { slug: 'app3', resourceJumps: '2-pager' },
    ],
    envs: [{ slug: 'dev' }, { slug: 'staging' }, { slug: 'prod' }],
  }),

  /**
   * A fictional car shop's internal tooling, for scenarios that read better in
   * domain language than in `app1`/`app2`. Service Booking is a 2-pager, so it
   * also covers a jump whose url needs a value typed in first.
   */
  carShop: (): Fixture => ({
    apps: [
      { slug: 'service-booking', resourceJumps: '2-pager' },
      { slug: 'parts-inventory', resourceJumps: '1-pager' },
      { slug: 'fleet-dashboard', resourceJumps: '1-pager' },
    ],
    envs: [{ slug: 'dev' }, { slug: 'staging' }, { slug: 'prod' }],
  }),
}

export const BackendMagazine = {
  default: (): MockBackend => createBackend(magazine.default()),
}

/** Seeds the client-side IndexedDB before the app mounts. */
export interface DbMagazineInstance {
  setup: (db: EhDb) => Promise<void> | void
}

export const DbMagazine = {
  default: (): DbMagazineInstance => ({
    setup: async (_db: EhDb) => {},
  }),
}
