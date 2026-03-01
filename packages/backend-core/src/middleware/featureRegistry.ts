import type { Router } from 'express'
import { toNodeHandler } from 'better-auth/node'
import type {
  EhFeatureToggles,
  EhMiddlewareOptions,
  MiddlewareContext,
} from './types'
import { createAdminChatHandler } from '../modules/admin/chat/createAdminChatHandler'
import { createMockSessionResponse } from '../modules/auth/devMockUserUtils'

interface FeatureRegistration {
  name: keyof EhFeatureToggles
  defaultEnabled: boolean
  register: (
    router: Router,
    options: Required<Pick<EhMiddlewareOptions, 'basePath'>> &
      EhMiddlewareOptions,
    context: MiddlewareContext,
  ) => void
}

// Optional features that can be toggled
const FEATURES: Array<FeatureRegistration> = [
  {
    name: 'auth',
    defaultEnabled: true,
    register: (router, options, ctx) => {
      const basePath = options.basePath

      // Explicit session endpoint handler
      router.get(
        `${basePath}/auth/session`,
        async (req, res): Promise<void> => {
          try {
            // Check if dev mock user is configured
            if (ctx.authConfig.devMockUser) {
              res.json(createMockSessionResponse(ctx.authConfig.devMockUser))
              return
            }

            const session = await ctx.auth.api.getSession({
              headers: req.headers as HeadersInit,
            })
            if (session) {
              res.json(session)
            } else {
              res.status(401).json({ error: 'Not authenticated' })
            }
          } catch (error) {
            console.error('[Auth Session Error]', error)
            res.status(500).json({ error: 'Internal server error' })
          }
        },
      )

      // Use toNodeHandler to adapt better-auth for Express/Node.js
      const authHandler = toNodeHandler(ctx.auth)
      router.all(`${basePath}/auth/{*any}`, authHandler)
    },
  },
  {
    name: 'adminChat',
    defaultEnabled: false, // Only enabled if adminChat config is provided
    register: (router, options) => {
      if (options.adminChat) {
        router.post(
          `${options.basePath}/admin/chat`,
          createAdminChatHandler(options.adminChat),
        )
      }
    },
  },
]

/**
 * Registers all enabled features on the router.
 */
export function registerFeatures(
  router: Router,
  options: Required<Pick<EhMiddlewareOptions, 'basePath'>> &
    EhMiddlewareOptions,
  context: MiddlewareContext,
): void {
  // Optional toggleable features
  const toggles = options.features || {}

  for (const feature of FEATURES) {
    const isEnabled = toggles[feature.name] ?? feature.defaultEnabled

    // Special case: adminChat is only enabled if config is provided
    if (feature.name === 'adminChat' && !options.adminChat) {
      continue
    }

    if (isEnabled) {
      feature.register(router, options, context)
    }
  }
}
