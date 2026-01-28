import type { Request, Response } from 'express'
import { getDbClient } from '../../db'

/**
 * Export the complete app catalog as JSON
 * Includes all fields from DbAppForCatalog and DbApprovalMethod
 */
export async function exportCatalog(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const prisma = getDbClient()

    // Fetch all catalog entries
    const apps = await prisma.dbAppForCatalog.findMany({
      orderBy: { slug: 'asc' },
    })

    // Fetch all approval methods
    const approvalMethods = await prisma.dbApprovalMethod.findMany({
      orderBy: { displayName: 'asc' },
    })

    res.json({
      version: '2.0',
      exportDate: new Date().toISOString(),
      apps,
      approvalMethods,
    })
  } catch (error) {
    console.error('Error exporting catalog:', error)
    res.status(500).json({ error: 'Failed to export catalog' })
  }
}

/**
 * Import/restore the complete app catalog from JSON
 * Overwrites existing data
 */
export async function importCatalog(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const prisma = getDbClient()
    const { apps, approvalMethods } = req.body

    if (!Array.isArray(apps)) {
      res
        .status(400)
        .json({ error: 'Invalid data format: apps must be an array' })
      return
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all existing approval methods first (due to potential FK references)
      if (Array.isArray(approvalMethods)) {
        await tx.dbApprovalMethod.deleteMany({})
      }

      // Delete all existing catalog entries
      await tx.dbAppForCatalog.deleteMany({})

      // Insert approval methods first
      if (Array.isArray(approvalMethods)) {
        for (const method of approvalMethods) {
          // Remove id, createdAt, updatedAt to let Prisma generate new ones
          const { id, createdAt, updatedAt, ...methodData } = method

          await tx.dbApprovalMethod.create({
            data: methodData,
          })
        }
      }

      // Insert app catalog entries
      for (const app of apps) {
        // Remove id, createdAt, updatedAt to let Prisma generate new ones
        const { id, createdAt, updatedAt, ...appData } = app

        await tx.dbAppForCatalog.create({
          data: appData,
        })
      }
    })

    res.json({
      success: true,
      imported: {
        apps: apps.length,
        approvalMethods: Array.isArray(approvalMethods)
          ? approvalMethods.length
          : 0,
      },
    })
  } catch (error) {
    console.error('Error importing catalog:', error)
    res.status(500).json({ error: 'Failed to import catalog' })
  }
}

/**
 * Export an asset (icon or screenshot) by name
 */
export async function exportAsset(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.params
    const prisma = getDbClient()

    const asset = await prisma.dbAsset.findUnique({
      where: { name },
    })

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' })
      return
    }

    // Set appropriate content type and send binary data
    res.set('Content-Type', asset.mimeType)
    res.set('Content-Disposition', `attachment; filename="${name}"`)
    res.send(Buffer.from(asset.content))
  } catch (error) {
    console.error('Error exporting asset:', error)
    res.status(500).json({ error: 'Failed to export asset' })
  }
}

/**
 * List all assets with metadata
 */
export async function listAssets(_req: Request, res: Response): Promise<void> {
  try {
    const prisma = getDbClient()

    const assets = await prisma.dbAsset.findMany({
      select: {
        id: true,
        name: true,
        assetType: true,
        mimeType: true,
        fileSize: true,
        width: true,
        height: true,
        checksum: true,
      },
      orderBy: { name: 'asc' },
    })

    res.json({ assets })
  } catch (error) {
    console.error('Error listing assets:', error)
    res.status(500).json({ error: 'Failed to list assets' })
  }
}

/**
 * Import an asset (icon or screenshot)
 */
export async function importAsset(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file
    const { name, assetType, mimeType, width, height } = req.body

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const prisma = getDbClient()
    const crypto = await import('node:crypto')

    // Calculate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex')

    // Convert Buffer to Uint8Array for Prisma Bytes type
    const content = new Uint8Array(file.buffer)

    // Upsert asset (update if exists, create if not)
    await prisma.dbAsset.upsert({
      where: { name },
      update: {
        content,
        checksum,
        mimeType: mimeType || file.mimetype,
        fileSize: file.size,
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        assetType: assetType || 'icon',
      },
      create: {
        name,
        content,
        checksum,
        mimeType: mimeType || file.mimetype,
        fileSize: file.size,
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        assetType: assetType || 'icon',
      },
    })

    res.json({ success: true, name, size: file.size })
  } catch (error) {
    console.error('Error importing asset:', error)
    res.status(500).json({ error: 'Failed to import asset' })
  }
}
