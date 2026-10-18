import { http } from 'msw'
import { createTRPCMsw, httpLink } from 'msw-trpc'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import {
  createEhTrpcContext,
  createTrpcRouter,
  packBootstrap,
} from '@env-hopper/backend-core'
import type {
  BootstrapConfigData,
  Catalog,
  EhBackendAppInput,
  EhBackendCompanySpecificBackend,
  EhCustomizationData,
  EhEnvAppOverride,
  EhEnvIndexed,
  EhEnvType,
  EhMetaDictionary,
  PairDeployment,
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

/** The pair-details queries are left out: the real router serves them. */
type StreamedKeys = 'pair' | 'slices' | 'users'

export type BackendData = {
  [K in Exclude<
    ProcedureKeys<TRPCRouter>,
    StreamedKeys
  >]: TRPCRouter[K] extends {
    _def: { $types: { output: infer O } }
  }
    ? O
    : never
}

/** How many pages an app contributes — a second page carries a late parameter. */
export type ResourceJumpType = '1-pager' | '2-pager'

export interface FixtureEnv {
  slug: string
  /**
   * Extra parameters the environment supplies to url and widget templates, on
   * top of the `subdomain` every fixture env carries. Keyed as the payload keys
   * them, so `env.meta.k8sCtx` rather than `k8sCtx`.
   */
  templateParams?: Record<string, string>
  envType?: EhEnvType
  /** How every app differs here: restated meta, and facilities it lacks. */
  appOverride?: EhEnvAppOverride
}

/** A username and password pair the app's own UI takes. */
export interface FixtureCredential {
  slug: string
  desc?: string
  username: string
  password: string
}

/** The app's database, as the db credentials widget shows it. */
export interface FixtureDb {
  url: string
  username: string
  password: string
}

export interface FixtureApp {
  slug: string
  resourceJumps?: ResourceJumpType
  /** More than one pair renders as a tab strip. */
  credentials?: Array<FixtureCredential>
  db?: FixtureDb
  /** The app's own template values, named by `{{app.meta.*}}`. */
  meta?: EhMetaDictionary
}

/**
 * The fixture DSL: name the envs and apps, and the mapper generates every
 * backend shape the frontend needs. A downstream repo builds its own catalogs
 * out of this and registers them with `registerCatalog`.
 */
export interface Fixture {
  apps: Array<FixtureApp>
  envs: Array<FixtureEnv>
  /** What the deployment fills in: the link list, its icons, footer markup. */
  customization?: EhCustomizationData
  /**
   * The version the deployment reports, as a real backend puts on the bootstrap
   * payload. Without this there is no way to test what a first-time visitor sees:
   * the header's label came out of local storage, so a fixture could only stage it
   * by pre-seeding storage, which is the one case a fresh visitor is not.
   */
  appVersion?: string
  /** What the deployment catalog knows, per App slug; absent means nothing. */
  deployments?: Record<string, FixtureDeployments>
}

/** An App's Components and where each runs, a row per Environment. */
export interface FixtureDeployments {
  components: PairDeployment['components']
  rows: Array<PairDeployment['rows'][number] & { env: string }>
  users?: PairDeployment['users']
}

export type OverrideBackendNetworkFn = (
  server: SetupServer,
  mswTrpc: TRPCMswInstance,
  backendData: BackendData,
) => void

export interface MockBackend {
  bootstrap: BootstrapConfigData
  resourceJumps: ResourceJumpsData
  /** Every procedure's answer, for consumers that serve them over real HTTP. */
  data: BackendData
  setupNetwork: (server: SetupServer) => void
  overrideBackendNetwork: (fn: OverrideBackendNetworkFn) => void
}

/**
 * `EhBackendAppInput` rather than `EhAppIndexed`, because credentials and data
 * sources are declared on the input type only — the client-facing type omits
 * them although the controller passes them through verbatim.
 */
export function createApp(
  slug: string,
  overrides?: Partial<EhBackendAppInput>,
): EhBackendAppInput {
  return { slug, displayName: toDisplayName(slug), ...overrides }
}

function appWidgetData(app: FixtureApp): Partial<EhBackendAppInput> {
  return {
    ...(app.credentials && { ui: { pages: [], credentials: app.credentials } }),
    ...(app.db && { dataSources: [{ type: 'db', ...app.db }] }),
  }
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
    fixture.envs.map((e) => [
      e.slug,
      createEnv(e.slug, {
        ...(e.envType && { envType: e.envType }),
        ...(e.appOverride && { appOverride: e.appOverride }),
      }),
    ]),
  )
  const bootstrapApps = Object.fromEntries(
    fixture.apps.map((a) => [
      a.slug,
      createApp(a.slug, {
        ...appWidgetData(a),
        ...(a.meta && { meta: a.meta }),
      }),
    ]),
  )

  // resourceJumps carries its own, flatter env shape.
  const resourceJumpEnvs = fixture.envs.map((e) => ({
    slug: e.slug,
    displayName: toDisplayName(e.slug),
    templateParams: { subdomain: e.slug, ...e.templateParams },
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
    ...(fixture.customization && { customization: fixture.customization }),
    ...(fixture.appVersion && { appVersion: fixture.appVersion }),
  }

  const resourceJumpsData: ResourceJumpsData = {
    resourceJumps,
    envs: resourceJumpEnvs,
    lateResolvableParams,
    groups,
  }

  const backendData: BackendData = {
    bootstrap: packBootstrap(bootstrap),
    resourceJumps: resourceJumpsData,
    resourceJumpsExtended: { envs: [] },
    // Procedures no scenario drives yet: answered, but with nothing in them.
    tryFindRenameRule: false,
    resourceJumpBySlugAndEnv: {
      resourceJumps: [],
      envs: [],
      lateResolvableParams: [],
    },
    authConfig: { adminGroups: ['env_hopper_ui_super_admins'] },
  }
  const streamed = streamedQueries(
    { bootstrap, resourceJumps: resourceJumpsData },
    fixture.deployments ?? {},
  )

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

    // Signed out. Registered even when a scenario overrides the tRPC layer,
    // because the app probes for a session on every mount and an unanswered
    // probe escapes to the real network. 401 is the quiet "nobody is logged in"
    // answer; any other failure makes the app log an error.
    server.use(
      http.get('*/api/auth/session', () => new Response(null, { status: 401 })),
      http.get(streamed.path, ({ request }) => streamed.handle(request)),
    )

    if (overrideBackendNetworkFn) {
      overrideBackendNetworkFn(server, mswTrpc, backendData)
    } else {
      server.use(
        mswTrpc.bootstrap.query(() => backendData.bootstrap),
        mswTrpc.resourceJumps.query(() => resourceJumpsData),
      )
    }
  }

  return {
    bootstrap,
    resourceJumps: resourceJumpsData,
    data: backendData,
    setupNetwork,
    overrideBackendNetwork: (fn) => {
      overrideBackendNetworkFn = fn
    },
  }
}

/**
 * `pair` and `slices`, answered by the real router over the fixture: its
 * config, and a catalog holding the fixture's Deployments. A batch of them is
 * one path, `pair,slices`.
 */
function streamedQueries(
  config: { bootstrap: BootstrapConfigData; resourceJumps: ResourceJumpsData },
  deployments: Record<string, FixtureDeployments>,
) {
  const catalog = {
    getPairDeployments: ({ appSlugs, envSlugs }) => {
      const apps = Object.entries(deployments).filter(
        ([app]) => !appSlugs || appSlugs.includes(app),
      )
      const pairs = new Map<
        string,
        { app: string; env: string; rows: PairDeployment['rows'] }
      >()
      for (const [app, d] of apps) {
        for (const { env, ...row } of d.rows) {
          if (envSlugs && !envSlugs.includes(env)) continue
          const key = `${app} ${env}`
          const pair = pairs.get(key) ?? { app, env, rows: [] }
          pair.rows.push(row)
          pairs.set(key, pair)
        }
      }
      return Promise.resolve({
        components: Object.fromEntries(apps.map(([a, d]) => [a, d.components])),
        pairs: [...pairs.values()].map((p) => ({
          ...p,
          users: deployments[p.app]?.users ?? {},
        })),
      })
    },
    getUsers: (usernames) =>
      Promise.resolve(
        Object.fromEntries(
          Object.values(deployments).flatMap((d) =>
            Object.entries(d.users ?? {}).filter(([u]) =>
              usernames.includes(u),
            ),
          ),
        ),
      ),
  } as Pick<Catalog, 'getPairDeployments' | 'getUsers'> as Catalog
  const companySpecificBackend = {
    getBootstrapData: () => Promise.resolve(config.bootstrap),
    getResourceJumps: () => Promise.resolve(config.resourceJumps),
  } as EhBackendCompanySpecificBackend
  const router = createTrpcRouter()
  const endpoint = new URL(TRPC_URL).pathname
  return {
    path: new RegExp(
      `^${TRPC_URL}/(pair|slices|users)(,(pair|slices|users))*(\\?|$)`,
    ),
    handle: (req: Request) =>
      fetchRequestHandler({
        endpoint,
        req,
        router,
        createContext: () =>
          createEhTrpcContext({
            companySpecificBackend,
            adminGroups: [],
            catalog,
          }),
      }),
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
