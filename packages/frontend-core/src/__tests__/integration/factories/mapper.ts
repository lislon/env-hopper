import type {
  BootstrapConfigData,
  ResourceJump,
  ResourceJumpGroup,
  ResourceJumpsData,
  TRPCRouter,
} from '@env-hopper/backend-core'
import { createTRPCMsw, httpLink } from 'msw-trpc'
import type { SetupServerApi } from 'msw/node'
import { createApp } from './app'
import { createEnv } from './env'
import type {
  FeatureAppConfig,
  FeatureBackendConfig,
  FeatureEnvConfig,
} from './types'

type TRPCMswInstance = ReturnType<typeof createTRPCMsw<TRPCRouter>>

// Infer BackendData from the TRPC router type automatically
// This extracts ALL query output types from the TRPCRouter
// Filter out router methods (_def, createCaller, etc.) and only keep procedures
type ProcedureKeys<T> = {
  [K in keyof T]: T[K] extends { _def: { $types: { output: any } } }
    ? T[K] extends { _def: { $types: { input: any } } }
      ? K // It's a procedure
      : never
    : never
}[keyof T]

type BackendData = {
  [K in ProcedureKeys<TRPCRouter>]: TRPCRouter[K] extends {
    _def: { $types: { output: infer O } }
  }
    ? O
    : never
}

/**
 * Maps feature-driven config to full backend entities
 */
export function mapFeatureConfigToBackend(config: FeatureBackendConfig): {
  bootstrap: BootstrapConfigData
  resourceJumps: ResourceJumpsData
  setupNetwork: (server: SetupServerApi) => void
  overrideBackendNetwork: (
    fn: (
      server: SetupServerApi,
      mswTrpc: TRPCMswInstance,
      backendData: BackendData,
    ) => void,
  ) => void
} {
  // Map envs for bootstrap
  const bootstrapEnvs = Object.fromEntries(
    config.envs.map((e) => [e.slug, createEnv(e.slug)]),
  )

  // Map apps for bootstrap
  const bootstrapApps = Object.fromEntries(
    config.apps.map((a) => [a.slug, createApp(a.slug)]),
  )

  // Map envs for resourceJumps (simpler structure)
  const resourceJumpEnvs = config.envs.map((e) => ({
    slug: e.slug,
    displayName: toDisplayName(e.slug),
    templateParams: { subdomain: e.slug },
  }))

  // Generate resource jumps with groups
  const { resourceJumps, groups, lateResolvableParams } =
    generateResourceJumpsWithGroups(config.apps, config.envs)

  const bootstrap: BootstrapConfigData = {
    envs: bootstrapEnvs,
    apps: bootstrapApps,
    appsMeta: { tags: { descriptions: [] } },
    contexts: [],
    defaults: {
      envSlug: config.envs[0]?.slug || '',
      resourceJumpSlug: resourceJumps[0]?.slug || '',
    },
  }

  let overrideBackendNetworkFn:
    | ((
        server: SetupServerApi,
        mswTrpc: TRPCMswInstance,
        backendData: BackendData,
      ) => void)
    | null = null

  const setupNetwork = (server: SetupServerApi) => {
    const mswTrpc = createTRPCMsw<TRPCRouter>({
      links: [
        httpLink({
          url: 'http://localhost:9999/trpc',
          headers() {
            return {
              'content-type': 'application/json',
            }
          },
        }),
      ],
    })

    // Create BackendData with minimal empty data for unused procedures
    const backendData: BackendData = {
      bootstrap,
      resourceJumps: {
        resourceJumps,
        envs: resourceJumpEnvs,
        lateResolvableParams,
        groups,
      },
      resourceJumpsExtended: {
        envs: [],
      },
      // Minimal empty data for other procedures (not used in tests)
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
      authConfig: {
        adminGroups: ['env_hopper_ui_super_admins'],
      },
    }

    // If override is provided, use it; otherwise use default setup
    if (overrideBackendNetworkFn) {
      overrideBackendNetworkFn(server, mswTrpc, backendData)
    } else {
      server.use(
        mswTrpc.bootstrap.query(() => {
          return bootstrap
        }),
      )
      server.use(
        mswTrpc.resourceJumps.query(() => {
          return {
            resourceJumps,
            envs: resourceJumpEnvs,
            lateResolvableParams,
            groups,
          }
        }),
      )
    }
  }

  const overrideBackendNetwork = (
    fn: (
      server: SetupServerApi,
      mswTrpc: TRPCMswInstance,
      backendData: BackendData,
    ) => void,
  ) => {
    overrideBackendNetworkFn = fn
  }

  return {
    bootstrap,
    resourceJumps: {
      resourceJumps,
      envs: resourceJumpEnvs,
      lateResolvableParams,
      groups,
    },
    setupNetwork,
    overrideBackendNetwork,
  }
}

/**
 * Generate resource jumps with proper grouping for multi-pagers
 */
function generateResourceJumpsWithGroups(
  apps: Array<FeatureAppConfig>,
  _envs: Array<FeatureEnvConfig>,
): {
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

    // Generate pages
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

      // Add late resolvable param for order page
      if (!isHome) {
        const orderIdParam = { slug: 'orderId', displayName: 'Order ID' }
        lateResolvableParamsMap.set('orderId', orderIdParam)
        jump.lateResolvableParamSlugs = ['orderId']
      }

      resourceJumps.push(jump)
    }

    // Create group if multi-pager
    if (pageCount > 1) {
      groups.push({
        slug: `${app.slug}-group`,
        displayName: toDisplayName(app.slug),
        resourceSlugs: pageSlugs, // First is primary, rest are children
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
