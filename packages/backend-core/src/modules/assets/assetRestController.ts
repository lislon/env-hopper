import type { AssetType } from '@prisma/client'
import type { Request, Response, Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { getDbClient } from '../../db'
import {
  generateChecksum,
  getImageDimensions,
  getImageFormat,
  isRasterImage,
  resizeImage,
} from './assetUtils'

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

export interface AssetRestControllerConfig {
  /**
   * Base path for asset endpoints (e.g., '/api/assets')
   */
  basePath: string
}

/**
 * Registers REST endpoints for universal asset upload and retrieval
 *
 * Endpoints:
 * - POST {basePath}/upload - Upload a new asset (multipart/form-data)
 * - GET {basePath}/:id - Get asset binary by ID
 * - GET {basePath}/:id/metadata - Get asset metadata only
 * - GET {basePath}/by-name/:name - Get asset binary by name
 */
export function registerAssetRestController(
  router: Router,
  config: AssetRestControllerConfig,
): void {
  const { basePath } = config

  // Upload endpoint - accepts multipart/form-data
  router.post(
    `${basePath}/upload`,
    upload.single('asset'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' })
          return
        }

        const name = req.body['name'] as string
        const assetTypeInput = req.body['assetType']
        const assetType = (assetTypeInput as AssetType | undefined) ?? 'icon'

        if (!name) {
          res.status(400).json({ error: 'Name is required' })
          return
        }

        const prisma = getDbClient()

        // Compute checksum of the binary for content-based deduplication.
        const checksum = generateChecksum(req.file.buffer)

        // If an asset with the same checksum already exists, reuse it instead of storing duplicate binary.
        const existing = await prisma.dbAsset.findUnique({
          where: { checksum },
          select: {
            id: true,
            name: true,
            assetType: true,
            checksum: true,
            mimeType: true,
            fileSize: true,
            width: true,
            height: true,
            createdAt: true,
          },
        })

        if (existing) {
          res.status(200).json(existing)
          return
        }

        // Get image dimensions using our utility
        const { width, height } = await getImageDimensions(req.file.buffer)

        const asset = await prisma.dbAsset.create({
          data: {
            name,
            checksum,
            assetType,
            content: new Uint8Array(req.file.buffer),
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            width,
            height,
          },
        })

        res.status(201).json({
          id: asset.id,
          name: asset.name,
          assetType: asset.assetType,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          createdAt: asset.createdAt,
        })
      } catch (error) {
        console.error('Error uploading asset:', error)
        res.status(500).json({ error: 'Failed to upload asset' })
      }
    },
  )

  // Get asset binary by ID
  router.get(`${basePath}/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const prisma = getDbClient()
      const asset = await prisma.dbAsset.findUnique({
        where: { id },
        select: {
          content: true,
          mimeType: true,
          name: true,
          width: true,
          height: true,
        },
      })

      if (!asset) {
        res.status(404).json({ error: 'Asset not found' })
        return
      }

      const resizeEnabled =
        String(process.env.EH_ASSETS_RESIZE_ENABLED || 'true') === 'true'
      const wParam = req.query['w'] as string | undefined
      const width = wParam ? Number.parseInt(wParam, 10) : undefined

      let outBuffer: Uint8Array = asset.content
      let outMime = asset.mimeType

      const shouldResize =
        resizeEnabled &&
        isRasterImage(asset.mimeType) &&
        !!width &&
        Number.isFinite(width) &&
        width > 0

      if (shouldResize) {
        const fmt = getImageFormat(asset.mimeType) || 'jpeg'
        const buf = await resizeImage(
          Buffer.from(asset.content),
          width,
          undefined,
          fmt,
        )
        outBuffer = new Uint8Array(buf)
        outMime = `image/${fmt}`
      }

      // Set appropriate headers
      res.setHeader('Content-Type', outMime)
      res.setHeader('Content-Disposition', `inline; filename="${asset.name}"`)
      res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day

      // Send binary content (resized if requested)
      res.send(outBuffer)
    } catch (error) {
      console.error('Error fetching asset:', error)
      res.status(500).json({ error: 'Failed to fetch asset' })
    }
  })

  // Get asset metadata only (no binary content)
  router.get(
    `${basePath}/:id/metadata`,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params

        const prisma = getDbClient()
        const asset = await prisma.dbAsset.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            assetType: true,
            mimeType: true,
            fileSize: true,
            width: true,
            height: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        if (!asset) {
          res.status(404).json({ error: 'Asset not found' })
          return
        }

        res.json(asset)
      } catch (error) {
        console.error('Error fetching asset metadata:', error)
        res.status(500).json({ error: 'Failed to fetch asset metadata' })
      }
    },
  )

  // Get asset binary by name
  router.get(
    `${basePath}/by-name/:name`,
    async (req: Request, res: Response) => {
      try {
        const { name } = req.params

        const prisma = getDbClient()
        const asset = await prisma.dbAsset.findUnique({
          where: { name },
          select: {
            content: true,
            mimeType: true,
            name: true,
            width: true,
            height: true,
          },
        })

        if (!asset) {
          res.status(404).json({ error: 'Asset not found' })
          return
        }

        const resizeEnabled =
          String(process.env.EH_ASSETS_RESIZE_ENABLED || 'true') === 'true'
        const wParam = req.query['w'] as string | undefined
        const width = wParam ? Number.parseInt(wParam, 10) : undefined

        let outBuffer: Uint8Array = asset.content
        let outMime = asset.mimeType

        const isRaster =
          asset.mimeType.startsWith('image/') && !asset.mimeType.includes('svg')
        const shouldResize =
          resizeEnabled &&
          isRaster &&
          !!width &&
          Number.isFinite(width) &&
          width > 0

        if (shouldResize) {
          const fmt = asset.mimeType.includes('png')
            ? 'png'
            : asset.mimeType.includes('webp')
              ? 'webp'
              : 'jpeg'

          let buf: Buffer
          const pipeline = sharp(Buffer.from(asset.content)).resize({
            width,
            fit: 'inside',
            withoutEnlargement: true,
          })
          if (fmt === 'png') {
            buf = await pipeline.png().toBuffer()
            outMime = 'image/png'
          } else if (fmt === 'webp') {
            buf = await pipeline.webp().toBuffer()
            outMime = 'image/webp'
          } else {
            buf = await pipeline.jpeg().toBuffer()
            outMime = 'image/jpeg'
          }
          outBuffer = new Uint8Array(buf)
        }

        // Set appropriate headers
        res.setHeader('Content-Type', outMime)
        res.setHeader('Content-Disposition', `inline; filename="${asset.name}"`)
        res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day

        // Send binary content (resized if requested)
        res.send(outBuffer)
      } catch (error) {
        console.error('Error fetching asset by name:', error)
        res.status(500).json({ error: 'Failed to fetch asset' })
      }
    },
  )
}
