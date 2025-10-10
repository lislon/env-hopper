import type { Request, Response, Router } from 'express'
import sharp from 'sharp'
import { getDbClient } from '../../db'

export interface ScreenshotRestControllerConfig {
  /**
   * Base path for screenshot endpoints (e.g., '/api/screenshots')
   */
  basePath: string
}

/**
 * Registers REST endpoints for screenshot retrieval
 * 
 * Endpoints:
 * - GET {basePath}/app/:appId - Get all screenshots for an app
 * - GET {basePath}/:id - Get screenshot binary by ID
 * - GET {basePath}/:id/metadata - Get screenshot metadata only
 */
export function registerScreenshotRestController(
  router: Router,
  config: ScreenshotRestControllerConfig,
): void {
  const { basePath } = config

  // Get all screenshots for an app
  router.get(`${basePath}/app/:appSlug`, async (req: Request, res: Response) => {
    try {
      const { appSlug } = req.params

      const prisma = getDbClient()
      
      // Find app by slug
      const app = await prisma.dbAppForCatalog.findUnique({
        where: { slug: appSlug },
        select: { screenshotIds: true },
      })

      if (!app) {
        res.status(404).json({ error: 'App not found' })
        return
      }

      // Fetch all screenshots for the app
      const screenshots = await prisma.dbAsset.findMany({
        where: {
          id: { in: app.screenshotIds },
          assetType: 'screenshot',
        },
        select: {
          id: true,
          name: true,
          mimeType: true,
          fileSize: true,
          width: true,
          height: true,
          createdAt: true,
        },
      })

      res.json(screenshots)
    } catch (error) {
      console.error('Error fetching app screenshots:', error)
      res.status(500).json({ error: 'Failed to fetch screenshots' })
    }
  })

  // Get first screenshot for an app (convenience endpoint)
  router.get(`${basePath}/app/:appSlug/first`, async (req: Request, res: Response) => {
    try {
      const { appSlug } = req.params

      const prisma = getDbClient()
      
      // Find app by slug
      const app = await prisma.dbAppForCatalog.findUnique({
        where: { slug: appSlug },
        select: { screenshotIds: true },
      })

      if (!app || app.screenshotIds.length === 0) {
        res.status(404).json({ error: 'No screenshots found' })
        return
      }

      // Fetch first screenshot
      const screenshot = await prisma.dbAsset.findUnique({
        where: { id: app.screenshotIds[0] },
        select: {
          id: true,
          name: true,
          mimeType: true,
          fileSize: true,
          width: true,
          height: true,
          createdAt: true,
        },
      })

      if (!screenshot) {
        res.status(404).json({ error: 'Screenshot not found' })
        return
      }

      res.json(screenshot)
    } catch (error) {
      console.error('Error fetching first screenshot:', error)
      res.status(500).json({ error: 'Failed to fetch screenshot' })
    }
  })

  // Get screenshot binary by ID
  router.get(`${basePath}/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const sizeParam = req.query.size as string | undefined
      const targetSize = sizeParam ? parseInt(sizeParam, 10) : undefined

      const prisma = getDbClient()
      const screenshot = await prisma.dbAsset.findUnique({
        where: { id },
        select: {
          content: true,
          mimeType: true,
          name: true,
        },
      })

      if (!screenshot) {
        res.status(404).json({ error: 'Screenshot not found' })
        return
      }

      let content: Uint8Array | Buffer = screenshot.content

      // Resize if size parameter provided
      if (targetSize && targetSize > 0) {
        try {
          content = await sharp(screenshot.content)
            .resize(targetSize, targetSize, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .toBuffer()
        } catch (resizeError) {
          console.error('Error resizing screenshot:', resizeError)
          // Fall back to original if resize fails
        }
      }

      // Set appropriate headers
      res.setHeader('Content-Type', screenshot.mimeType)
      res.setHeader('Content-Disposition', `inline; filename="${screenshot.name}"`)
      res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day

      // Send binary content
      res.send(content)
    } catch (error) {
      console.error('Error fetching screenshot:', error)
      res.status(500).json({ error: 'Failed to fetch screenshot' })
    }
  })

  // Get screenshot metadata only (no binary content)
  router.get(`${basePath}/:id/metadata`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const prisma = getDbClient()
      const screenshot = await prisma.dbAsset.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          mimeType: true,
          fileSize: true,
          width: true,
          height: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!screenshot) {
        res.status(404).json({ error: 'Screenshot not found' })
        return
      }

      res.json(screenshot)
    } catch (error) {
      console.error('Error fetching screenshot metadata:', error)
      res.status(500).json({ error: 'Failed to fetch screenshot metadata' })
    }
  })
}
