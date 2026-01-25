import type { Request, Response, Router } from 'express'
import multer from 'multer'
import { createHash } from 'node:crypto'
import { getDbClient } from '../../db'
import { getExtensionFromFilename, getExtensionFromMimeType } from './iconUtils'

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'))
      return
    }
    cb(null, true)
  },
})

export interface IconRestControllerConfig {
  /**
   * Base path for icon endpoints (e.g., '/api/icons')
   */
  basePath: string
}

/**
 * Registers REST endpoints for icon upload and retrieval
 *
 * Endpoints:
 * - POST {basePath}/upload - Upload a new icon (multipart/form-data with 'icon' field and 'name' field)
 * - GET {basePath}/:id - Get icon binary by ID
 * - GET {basePath}/:id/metadata - Get icon metadata only
 */
export function registerIconRestController(
  router: Router,
  config: IconRestControllerConfig,
): void {
  const { basePath } = config

  // Upload endpoint - accepts multipart/form-data
  router.post(
    `${basePath}/upload`,
    upload.single('icon'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' })
          return
        }

        let name = req.body['name'] as string
        if (!name) {
          res.status(400).json({ error: 'Name is required' })
          return
        }

        // Extract extension from original filename or derive from MIME type
        const extension =
          getExtensionFromFilename(req.file.originalname) ||
          getExtensionFromMimeType(req.file.mimetype)

        // Add extension to name if not already present
        if (!name.includes('.')) {
          name = `${name}.${extension}`
        }

        const prisma = getDbClient()
        const checksum = createHash('sha256')
          .update(req.file.buffer)
          .digest('hex')
        const icon = await prisma.dbAsset.create({
          data: {
            name,
            assetType: 'icon',
            content: new Uint8Array(req.file.buffer),
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            checksum,
          },
        })

        res.status(201).json({
          id: icon.id,
          name: icon.name,
          mimeType: icon.mimeType,
          fileSize: icon.fileSize,
          createdAt: icon.createdAt,
        })
      } catch (error) {
        console.error('Error uploading icon:', error)
        res.status(500).json({ error: 'Failed to upload icon' })
      }
    },
  )

  // Get icon binary by name (e.g., /api/icons/jira.svg)
  router.get(`${basePath}/:name`, async (req: Request, res: Response) => {
    try {
      const { name } = req.params

      const prisma = getDbClient()
      const icon = await prisma.dbAsset.findFirst({
        where: {
          name,
          assetType: 'icon',
        },
        select: {
          content: true,
          mimeType: true,
          name: true,
        },
      })

      if (!icon) {
        res.status(404).json({ error: 'Icon not found' })
        return
      }

      // Set appropriate headers
      res.setHeader('Content-Type', icon.mimeType)
      res.setHeader('Content-Disposition', `inline; filename="${icon.name}"`)
      res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day

      // Send binary content
      res.send(icon.content)
    } catch (error) {
      console.error('Error fetching icon:', error)
      res.status(500).json({ error: 'Failed to fetch icon' })
    }
  })

  // Get icon metadata only (no binary content)
  router.get(
    `${basePath}/:name/metadata`,
    async (req: Request, res: Response) => {
      try {
        const { name } = req.params

        const prisma = getDbClient()
        const icon = await prisma.dbAsset.findFirst({
          where: {
            name,
            assetType: 'icon',
          },
          select: {
            id: true,
            name: true,
            mimeType: true,
            fileSize: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        if (!icon) {
          res.status(404).json({ error: 'Icon not found' })
          return
        }

        res.json(icon)
      } catch (error) {
        console.error('Error fetching icon metadata:', error)
        res.status(500).json({ error: 'Failed to fetch icon metadata' })
      }
    },
  )
}
