import { readFileSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { getDbClient } from '../../db'
import { generateChecksum, getImageDimensions } from './assetUtils'

export interface SyncAssetsConfig {
  /**
   * Directory containing icon files to sync
   */
  iconsDir?: string

  /**
   * Directory containing screenshot files to sync
   */
  screenshotsDir?: string
}

/**
 * Sync local asset files (icons and screenshots) from directories into the database.
 *
 * This function allows consuming applications to sync asset files without directly
 * exposing the Prisma client. It handles:
 * - Icon files: Assigned to apps by matching filename to icon name patterns
 * - Screenshot files: Assigned to apps by matching filename to app ID (format: <app-id>_screenshot_<no>.<ext>)
 *
 * @param config Configuration with paths to icon and screenshot directories
 */
export async function syncAssets(config: SyncAssetsConfig): Promise<{
  iconsUpserted: number
  screenshotsUpserted: number
}> {
  const prisma = getDbClient()
  let iconsUpserted = 0
  let screenshotsUpserted = 0

  // Sync icons from local/icons directory
  if (config.iconsDir) {
    console.log(`📁 Syncing icons from ${config.iconsDir}...`)
    iconsUpserted = await syncIconsFromDirectory(prisma, config.iconsDir)
    console.log(`   ✓ Upserted ${iconsUpserted} icons`)
  }

  // Sync screenshots from local/screenshots directory
  if (config.screenshotsDir) {
    console.log(`📷 Syncing screenshots from ${config.screenshotsDir}...`)
    screenshotsUpserted = await syncScreenshotsFromDirectory(
      prisma,
      config.screenshotsDir,
    )
    console.log(
      `   ✓ Upserted ${screenshotsUpserted} screenshots and assigned to apps`,
    )
  }

  return {
    iconsUpserted,
    screenshotsUpserted,
  }
}

/**
 * Sync icon files from a directory
 */
async function syncIconsFromDirectory(
  prisma: ReturnType<typeof getDbClient>,
  iconsDir: string,
): Promise<number> {
  let count = 0

  try {
    const files = readdirSync(iconsDir)

    for (const file of files) {
      const filePath = join(iconsDir, file)
      const ext = extname(file).toLowerCase().slice(1) // Remove leading dot

      // Skip non-image files
      if (!['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        continue
      }

      try {
        const content = readFileSync(filePath)
        const buffer = Buffer.from(content)
        const checksum = generateChecksum(buffer)
        const iconName = file.replace(/\.[^/.]+$/, '') // Remove extension

        // Check if asset with same checksum already exists
        const existing = await prisma.dbAsset.findFirst({
          where: { checksum, assetType: 'icon' },
        })

        if (existing) {
          continue // Already synced
        }

        // Extract dimensions for raster images
        let width: number | null = null
        let height: number | null = null
        if (!ext.includes('svg')) {
          const { width: w, height: h } = await getImageDimensions(buffer)
          width = w ?? null
          height = h ?? null
        }

        // Determine MIME type
        const mimeType =
          {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
          }[ext] || 'application/octet-stream'

        await prisma.dbAsset.create({
          data: {
            name: iconName,
            assetType: 'icon',
            content: new Uint8Array(buffer),
            checksum,
            mimeType,
            fileSize: buffer.length,
            width,
            height,
          },
        })

        count++
      } catch (error) {
        console.warn(`  ⚠ Failed to sync icon ${file}:`, error)
      }
    }
  } catch (error) {
    console.error(`  ❌ Error reading icons directory:`, error)
  }

  return count
}

/**
 * Sync screenshot files from a directory and assign to apps
 */
async function syncScreenshotsFromDirectory(
  prisma: ReturnType<typeof getDbClient>,
  screenshotsDir: string,
): Promise<number> {
  let count = 0

  try {
    const files = readdirSync(screenshotsDir)

    // Group screenshots by app ID
    const screenshotsByApp = new Map<
      string,
      Array<{ path: string; ext: string }>
    >()

    for (const file of files) {
      // Parse filename: <app-id>_screenshot_<no>.<ext>
      const match = file.match(/^(.+?)_screenshot_(\d+)\.([^.]+)$/)
      if (!match || !match[1] || !match[3]) {
        continue
      }

      const appId = match[1]
      const ext = match[3]
      if (!screenshotsByApp.has(appId)) {
        screenshotsByApp.set(appId, [])
      }
      screenshotsByApp.get(appId)!.push({
        path: join(screenshotsDir, file),
        ext,
      })
    }

    // Process each app's screenshots
    for (const [appId, screenshots] of screenshotsByApp) {
      try {
        // Check if app exists
        const app = await prisma.dbAppForCatalog.findUnique({
          where: { slug: appId },
          select: { id: true },
        })

        if (!app) {
          console.warn(`  ⚠ App not found: ${appId}`)
          continue
        }

        // Sync screenshots for this app
        for (const screenshot of screenshots) {
          try {
            const content = readFileSync(screenshot.path)
            const buffer = Buffer.from(content)
            const checksum = generateChecksum(buffer)

            // Check if screenshot with same checksum already exists
            const existing = await prisma.dbAsset.findFirst({
              where: { checksum, assetType: 'screenshot' },
            })

            if (existing) {
              // Link to app via screenshotIds array if not already linked
              const existingApp = await prisma.dbAppForCatalog.findUnique({
                where: { slug: appId },
              })
              if (
                existingApp &&
                !existingApp.screenshotIds.includes(existing.id)
              ) {
                await prisma.dbAppForCatalog.update({
                  where: { slug: appId },
                  data: {
                    screenshotIds: [...existingApp.screenshotIds, existing.id],
                  },
                })
              }
              continue
            }

            // Extract dimensions
            const { width, height } = await getImageDimensions(buffer)

            // Determine MIME type
            const mimeType =
              {
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                gif: 'image/gif',
                webp: 'image/webp',
              }[screenshot.ext.toLowerCase()] || 'application/octet-stream'

            // Create screenshot asset
            const asset = await prisma.dbAsset.create({
              data: {
                name: `${appId}-screenshot-${Date.now()}`,
                assetType: 'screenshot',
                content: new Uint8Array(buffer),
                checksum,
                mimeType,
                fileSize: buffer.length,
                width: width ?? null,
                height: height ?? null,
              },
            })

            // Link screenshot to app via screenshotIds array
            await prisma.dbAppForCatalog.update({
              where: { slug: appId },
              data: {
                screenshotIds: {
                  push: asset.id,
                },
              },
            })

            count++
          } catch (error) {
            console.warn(
              `  ⚠ Failed to sync screenshot ${screenshot.path}:`,
              error,
            )
          }
        }
      } catch (error) {
        console.warn(`  ⚠ Failed to process app ${appId}:`, error)
      }
    }
  } catch (error) {
    console.error(`  ❌ Error reading screenshots directory:`, error)
  }

  return count
}
