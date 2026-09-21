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

  /**
   * A fictional veterinary clinic, for the scenarios about what is shown BESIDE
   * the form — shared logins, database connection details, per-app links.
   *
   * It is built around the one asymmetry that matters: `staging` is a throwaway
   * environment where a shared login and a database url are exactly what someone
   * needs, and `production` is not. Production therefore says so in the payload
   * rather than relying on anyone remembering — it declares both facilities
   * unavailable, and restates the app's meta because it is reached at a fixed
   * host instead of by the pattern the other environments follow.
   */
  vetClinic: (): Fixture => ({
    apps: [
      {
        slug: 'appointments',
        resourceJumps: '2-pager',
        credentials: [
          {
            slug: 'reception',
            desc: 'the shared front-desk login',
            username: 'reception@vet.example',
            password: 'front-desk',
          },
        ],
        db: {
          url: 'jdbc:postgresql://db-{{env.meta.dbHost}}:5432/appointments',
          username: 'appointments_ro',
          password: 'read-only',
        },
        meta: {
          repo: 'https://git.example.test/vet/appointments',
          issues: 'VET',
        },
      },
      {
        // No credentials, no database, no repository: the app that proves an
        // empty panel is a property of the app and not of the environment.
        slug: 'x-ray-viewer',
        resourceJumps: '1-pager',
      },
    ],
    envs: [
      {
        slug: 'staging',
        templateParams: {
          'env.meta.dbHost': 'staging-1',
          'env.meta.statusPath': 'staging',
        },
        envType: 'stage',
      },
      {
        slug: 'production',
        templateParams: { 'env.meta.statusPath': 'live' },
        envType: 'prod',
        appOverride: {
          meta: { repo: 'https://git.example.test/vet/appointments-released' },
          unavailable: ['credentials', 'dataSources'],
        },
      },
    ],
    customization: {
      appLinkTypes: [
        {
          typeId: 'status',
          iconId: 'status',
          title: '{{env.id}} status page',
          urlDecoded: 'https://status.example.test/{{env.meta.statusPath}}',
        },
        {
          typeId: 'repo',
          iconId: 'git',
          title: 'Source Code',
          urlDecoded: '{{app.meta.repo}}',
        },
        {
          typeId: 'issues',
          iconId: 'tracker',
          title: '{{app.meta.issues}} issues',
          urlDecoded: 'https://tracker.example.test/browse/{{app.meta.issues}}',
        },
      ],
      icons: [{ iconId: 'git', svg: '<svg data-icon="git" />' }],
    },
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
