import { createHash } from 'node:crypto'
import type { FormatEnum } from 'sharp'
import sharp from 'sharp'
import type { ParseAssetParams, ParseAssetReturn } from './assetRestController'

/**
 * Extract image dimensions from a buffer using sharp
 */
export async function getImageDimensions(
  buffer: Buffer,
): Promise<{ width?: number; height?: number }> {
  try {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
    }
  } catch (error) {
    console.error('Error extracting image dimensions:', error)
    return { width: undefined, height: undefined }
  }
}

/**
 * Resize an image buffer to the specified dimensions
 * @param buffer - The image buffer to resize
 * @param width - Target width (optional)
 * @param height - Target height (optional)
 * @param format - Output format ('png', 'jpeg', 'webp'), auto-detected if not provided
 */
export async function resizeImage(
  buffer: Buffer,
  width?: number,
  height?: number,
  format?: 'png' | 'jpeg' | 'webp',
): Promise<Buffer> {
  let pipeline = sharp(buffer)

  // Apply resize if dimensions provided
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Apply format conversion if specified
  if (format === 'png') {
    pipeline = pipeline.png()
  } else if (format === 'webp') {
    pipeline = pipeline.webp()
  } else if (format === 'jpeg') {
    pipeline = pipeline.jpeg()
  }

  return pipeline.toBuffer()
}

/**
 * Generate SHA-256 checksum for a buffer
 */
export function generateChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Detect image format from mime type
 */
export function getImageFormat(
  mimeType: string,
): 'png' | 'webp' | 'jpeg' | null {
  if (mimeType.includes('png')) return 'png'
  if (mimeType.includes('webp')) return 'webp'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg'
  return null
}

/**
 * Check if a mime type represents a raster image (not SVG)
 */
export function isRasterImage(mimeType: string): boolean {
  return mimeType.startsWith('image/') && !mimeType.includes('svg')
}

export async function parseAssetMeta(
  p: ParseAssetParams,
): Promise<ParseAssetReturn> {
  // Get image dimensions using our utility
  const { width, height, format, size } = await sharp(p.buffer).metadata()

  const formatToMime: Partial<Record<keyof FormatEnum, string>> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    tiff: 'image/tiff',
    gif: 'image/gif',
    heif: 'image/heif',
    raw: 'application/octet-stream',
  }

  return {
    checksum: generateChecksum(p.buffer),
    width,
    height,
    mimeType: format
      ? (formatToMime[format] ?? `image/${format}`)
      : 'application/octet-stream',
    fileSize: size || 0,
  }
}
