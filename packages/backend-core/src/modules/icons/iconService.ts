import { getDbClient } from '../../db'
import { generateChecksum, getImageDimensions } from '../assets/assetUtils'

export interface UpsertIconInput {
  name: string
  content: Buffer
  mimeType: string
  fileSize: number
}

/**
 * Upsert an icon to the database.
 * If an icon with the same name exists, it will be updated.
 * Otherwise, a new icon will be created.
 */
export async function upsertIcon(input: UpsertIconInput) {
  const prisma = getDbClient()
  
  const checksum = generateChecksum(input.content)
  const { width, height } = await getImageDimensions(input.content)
  
  return prisma.dbAsset.upsert({
    where: { name: input.name },
    update: {
      content: new Uint8Array(input.content),
      checksum,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      width,
      height,
    },
    create: {
      name: input.name,
      assetType: 'icon',
      content: new Uint8Array(input.content),
      checksum,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      width,
      height,
    },
  })
}

/**
 * Upsert multiple icons to the database.
 * This is more efficient than calling upsertIcon multiple times.
 */
export async function upsertIcons(icons: Array<UpsertIconInput>) {
  const results = []
  for (const icon of icons) {
    const result = await upsertIcon(icon)
    results.push(result)
  }
  return results
}

/**
 * Get an asset (icon or screenshot) by name from the database.
 * Returns the asset content, mimeType, and name if found.
 */
export async function getAssetByName(name: string) {
  const prisma = getDbClient()
  
  return prisma.dbAsset.findUnique({
    where: { name },
    select: {
      content: true,
      mimeType: true,
      name: true,
    },
  })
}
