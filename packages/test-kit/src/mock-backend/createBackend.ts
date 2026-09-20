import { http } from 'msw'
import { createTRPCMsw, httpLink } from 'msw-trpc'
import type {
  BootstrapConfigData,
  EhAppIndexed,
  EhEnvIndexed,
  ResourceJump,
  ResourceJumpGroup,
  ResourceJumpsData,
  TRPCRouter,
} from '@env-hopper/backend-core'
import type { SetupServer } from 'msw/node'

/** Where the harness's tRPC client points; the msw handlers have to agree. */
export const TRPC_URL = 'http://localhost:9999/trpc'

type TRPCMswInstance = ReturnType<typeof createTRPCMsw<TRPCRouter>>

// Derive BackendData from the router type rather than restating it, so a new
// procedure is a type error here instead of a silently unmocked call at runtime.
// Router internals (`_def`, `createCaller`, ...) are filtered out by requiring
// both an input and an output type.
type ProcedureKeys<T> = {
  [K in keyof T]: T[K] extends { _def: { $types: { output: any } } }
    ? T[K] extends { _def: { $types: { input: any } } }
      ? K
      : never
    : never
}[keyof T]

export type BackendData = {
  [K in ProcedureKeys<TRPCRouter>]: TRPCRouter[K] extends {
    _def: { $types: { output: infer O } }
  }
    ? O
    : never
}

/** How many pages an app contributes — a second page carries a late parameter. */
export type ResourceJumpType = '1-pager' | '2-pager'

export interface FixtureEnv {
  slug: string
}

export interface FixtureApp {
  slug: string
  resourceJumps?: ResourceJumpType
}

/**
 * The fixture DSL: name the envs and apps, and the mapper generates every
 * backend shape the frontend needs. A downstream repo builds its own catalogs
 * out of this and registers them with `registerCatalog`.
 */
export interface Fixture {
  apps: Array<FixtureApp>
  envs: Array<FixtureEnv>
}

export type OverrideBackendNetworkFn = (
  server: SetupServer,
  mswTrpc: TRPCMswInstance,
  backendData: BackendData,
) => void

export interface MockBackend {
  bootstrap: BootstrapConfigData
  resourceJumps: ResourceJumpsData
  setupNetwork: (server: SetupServer) => void
  overrideBackendNetwork: (fn: OverrideBackendNetworkFn) => void
}

export function createApp(
  slug: string,
  overrides?: Partial<EhAppIndexed>,
): EhAppIndexed {
  return { slug, displayName: toDisplayName(slug), ...overrides }
}

export function createEnv(
  slug: string,
  overrides?: Partial<EhEnvIndexed>,
): EhEnvIndexed {
  return { slug, displayName: toDisplayName(slug), ...overrides }
}

/** Expand a fixture into the full set of backend responses. */
export function createBackend(fixture: Fixture): MockBackend {
  const bootstrapEnvs = Object.fromEntries(
    fixture.envs.map((e) => [e.slug, createEnv(e.slug)]),
  )
  const bootstrapApps = Object.fromEntries(
    fixture.apps.map((a) => [a.slug, createApp(a.slug)]),
  )

  // resourceJumps carries its own, flatter env shape.
  const resourceJumpEnvs = fixture.envs.map((e) => ({
    slug: e.slug,
    displayName: toDisplayName(e.slug),
    templateParams: { subdomain: e.slug },
  }))

  const { resourceJumps, groups, lateResolvableParams } =
    generateResourceJumpsWithGroups(fixture.apps)

  const bootstrap: BootstrapConfigData = {
    envs: bootstrapEnvs,
    apps: bootstrapApps,
    appsMeta: { tags: { descriptions: [] } },
    contexts: [],
    defaults: {
      envSlug: fixture.envs[0]?.slug || '',
      resourceJumpSlug: resourceJumps[0]?.slug || '',
    },
  }

  const resourceJumpsData: ResourceJumpsData = {
    resourceJumps,
    envs: resourceJumpEnvs,
    lateResolvableParams,
    groups,
  }

  let overrideBackendNetworkFn: OverrideBackendNetworkFn | null = null

  const setupNetwork = (server: SetupServer) => {
    const mswTrpc = createTRPCMsw<TRPCRouter>({
      links: [
        httpLink({
          url: TRPC_URL,
          headers() {
            return { 'content-type': 'application/json' }
          },
        }),
      ],
    })

    const backendData: BackendData = {
      bootstrap,
      resourceJumps: resourceJumpsData,
      resourceJumpsExtended: { envs: [] },
      // Procedures no scenario drives yet: answered, but with nothing in them.
      availabilityMatrix: {
        envSlugs: [],
        resourceJumpSlugs: [],
        availabilityVariants: [],
        matrix: [],
      },
      tryFindRenameRule: false,
      resourceJumpBySlugAndEnv: {
        resourceJumps: [],
        envs: [],
        lateResolvableParams: [],
      },
      authConfig: { adminGroups: ['env_hopper_ui_super_admins'] },
    }

    // Signed out. Registered even when a scenario overrides the tRPC layer,
    // because the app probes for a session on every mount and an unanswered
    // probe escapes to the real network. 401 is the quiet "nobody is logged in"
    // answer; any other failure makes the app log an error.
    server.use(
      http.get('*/api/auth/session', () => new Response(null, { status: 401 })),
    )

    if (overrideBackendNetworkFn) {
      overrideBackendNetworkFn(server, mswTrpc, backendData)
    } else {
      server.use(
        mswTrpc.bootstrap.query(() => bootstrap),
        mswTrpc.resourceJumps.query(() => resourceJumpsData),
      )
    }
  }

  return {
    bootstrap,
    resourceJumps: resourceJumpsData,
    setupNetwork,
    overrideBackendNetwork: (fn) => {
      overrideBackendNetworkFn = fn
    },
  }
}

/**
 * A 2-pager becomes two jumps in one group: the app's home page, plus an order
 * page whose url needs a late-resolvable `orderId` the person types in.
 */
function generateResourceJumpsWithGroups(apps: Array<FixtureApp>): {
  resourceJumps: Array<ResourceJump>
  groups: Array<ResourceJumpGroup>
  lateResolvableParams: Array<{ slug: string; displayName: string }>
} {
  const resourceJumps: Array<ResourceJump> = []
  const groups: Array<ResourceJumpGroup> = []
  const lateResolvableParamsMap = new Map<
    string,
    { slug: string; displayName: string }
  >()

  apps.forEach((app) => {
    if (!app.resourceJumps) return

    const pageCount = app.resourceJumps === '1-pager' ? 1 : 2
    const pageSlugs: Array<string> = []

    for (let i = 0; i < pageCount; i++) {
      const isHome = i === 0
      const slug = isHome ? app.slug : `${app.slug}-order`
      pageSlugs.push(slug)

      const jump: ResourceJump = {
        slug,
        displayName: isHome ? toDisplayName(app.slug) : 'Order Details',
        urlTemplate: {
          default: isHome
            ? `http://localhost:4000/env/{{subdomain}}/app/${app.slug}`
            : `http://localhost:4000/env/{{subdomain}}/app/${app.slug}/order/{{orderId}}`,
        },
      }

      if (!isHome) {
        lateResolvableParamsMap.set('orderId', {
          slug: 'orderId',
          displayName: 'Order ID',
        })
        jump.lateResolvableParamSlugs = ['orderId']
      }

      resourceJumps.push(jump)
    }

    // First slug is the primary page, the rest are its children.
    if (pageCount > 1) {
      groups.push({
        slug: `${app.slug}-group`,
        displayName: toDisplayName(app.slug),
        resourceSlugs: pageSlugs,
      })
    }
  })

  return {
    resourceJumps,
    groups,
    lateResolvableParams: Array.from(lateResolvableParamsMap.values()),
  }
}

function toDisplayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
