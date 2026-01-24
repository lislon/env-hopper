import type { Router } from 'express'
import { toNodeHandler } from 'better-auth/node'
import type {
  EhFeatureToggles,
  EhMiddlewareOptions,
  MiddlewareContext,
} from './types'
import { registerIconRestController } from '../modules/icons/iconRestController'
import { registerAssetRestController } from '../modules/assets/assetRestController'
import { registerScreenshotRestController } from '../modules/assets/screenshotRestController'
import { createAdminChatHandler } from '../modules/admin/chat/createAdminChatHandler'
import { getAssetByName } from '../modules/icons/iconService'
import {
  exportAsset,
  exportCatalog,
  importAsset,
  importCatalog,
  listAssets,
} from '../modules/appCatalogAdmin/catalogBackupController'
import multer from 'multer'

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
      router.get(`${basePath}/auth/session`, async (req, res) => {
        try {
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
      })

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
  {
    name: 'legacyIconEndpoint',
    defaultEnabled: false,
    register: (router) => {
      // Legacy endpoint at /static/icon/:icon for backwards compatibility
      router.get('/static/icon/:icon', async (req, res) => {
        const { icon } = req.params

        if (!icon || !/^[a-z0-9-]+$/i.test(icon)) {
          res.status(400).send('Invalid icon name')
          return
        }

        try {
          const dbIcon = await getAssetByName(icon)

          if (!dbIcon) {
            res.status(404).send('Icon not found')
            return
          }

          res.setHeader('Content-Type', dbIcon.mimeType)
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.send(dbIcon.content)
        } catch (error) {
          console.error('Error fetching icon:', error)
          res.status(404).send('Icon not found')
        }
      })
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
  const basePath = options.basePath

  // Always-on features (required for core functionality)

  // Icons
  registerIconRestController(router, {
    basePath: `${basePath}/icons`,
  })

  // Assets
  registerAssetRestController(router, {
    basePath: `${basePath}/assets`,
  })

  // Screenshots
  registerScreenshotRestController(router, {
    basePath: `${basePath}/screenshots`,
  })

  // Catalog backup/restore
  const upload = multer({ storage: multer.memoryStorage() })
  router.get(`${basePath}/catalog/backup/export`, exportCatalog)
  router.post(`${basePath}/catalog/backup/import`, importCatalog)
  router.get(`${basePath}/catalog/backup/assets`, listAssets)
  router.get(`${basePath}/catalog/backup/assets/:name`, exportAsset)
  router.post(
    `${basePath}/catalog/backup/assets`,
    upload.single('file'),
    importAsset,
  )

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
