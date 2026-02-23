import { parseAssetMeta } from './assetUtils'
import type { AssetType, PrismaClient } from '@prisma/client'

export interface UpsertAssetParams {
  prisma: PrismaClient
  buffer: Buffer
  name: string
  originalFilename: string
  assetType: AssetType
}

export async function upsertAsset({
  prisma,
  buffer,
  name,
  originalFilename,
  assetType,
}: UpsertAssetParams) {
  const { checksum, fileSize, width, height, mimeType } = await parseAssetMeta({
    buffer,
    originalFilename,
  })

  // If an asset with the same checksum already exists, reuse it instead of storing duplicate binary.
  const existing = await prisma.dbAsset.findUnique({
    where: { name },
  })

  if (existing) {
    return existing.id
  }

  const asset = await prisma.dbAsset.create({
    data: {
      name,
      checksum,
      assetType,
      content: new Uint8Array(buffer),
      mimeType,
      fileSize,
      width,
      height,
    },
  })
  return asset.id
}
