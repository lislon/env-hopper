import type { TRPCRootObject } from '@trpc/server'
import { z } from 'zod'
import { getDbClient } from '../../db'
import type { EhTrpcContext } from '../../server/ehTrpcContext'
import { generateChecksum, getImageDimensions } from '../assets/assetUtils'
import { getExtensionFromMimeType } from './iconUtils'

export function createIconRouter(t: TRPCRootObject<EhTrpcContext, {}, {}>) {
  const router = t.router
  const publicProcedure = t.procedure

  return router({
    list: publicProcedure.query(async () => {
      const prisma = getDbClient()
      return prisma.dbAsset.findMany({
        where: { assetType: 'icon' },
        select: {
          id: true,
          name: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      })
    }),

    getOne: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAsset.findFirst({
          where: {
            id: input.id,
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
      }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1), // Name with extension (e.g., "jira.svg")
          content: z.string(), // base64 encoded binary
          mimeType: z.string(),
          fileSize: z.number().int().positive(),
        }),
      )
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        // Convert base64 to Buffer
        const buffer = Buffer.from(input.content, 'base64')

        // Generate checksum and extract dimensions
        const checksum = generateChecksum(buffer)
        const { width, height } = await getImageDimensions(buffer)

        let name = input.name
        // Add extension if not already present in name
        if (!name.includes('.')) {
          const extension = getExtensionFromMimeType(input.mimeType)
          name = `${name}.${extension}`
        }

        // Check if asset with same checksum already exists
        const existing = await prisma.dbAsset.findFirst({
          where: { checksum, assetType: 'icon' },
        })

        if (existing) {
          // Return existing asset if content is identical
          return existing
        }

        return prisma.dbAsset.create({
          data: {
            name,
            assetType: 'icon',
            content: new Uint8Array(buffer),
            checksum,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            width,
            height,
          },
        })
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1).optional(), // Name with extension (e.g., "jira.svg")
          content: z.string().optional(), // base64 encoded binary
          mimeType: z.string().optional(),
          fileSize: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        const { id, content, name, ...rest } = input

        const data: Record<string, unknown> = { ...rest }

        if (content) {
          const buffer = Buffer.from(content, 'base64')
          data.content = new Uint8Array(buffer)
          data.checksum = generateChecksum(buffer)

          const { width, height } = await getImageDimensions(buffer)
          data.width = width
          data.height = height
        }

        // If name is being updated and doesn't have extension, add it
        if (name) {
          if (!name.includes('.') && input.mimeType) {
            const extension = getExtensionFromMimeType(input.mimeType)
            data.name = `${name}.${extension}`
          } else {
            data.name = name
          }
        }

        return prisma.dbAsset.update({
          where: { id },
          data,
        })
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAsset.delete({
          where: { id: input.id },
        })
      }),

    deleteMany: publicProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAsset.deleteMany({
          where: {
            id: { in: input.ids },
            assetType: 'icon',
          },
        })
      }),

    // Serve icon binary content
    getContent: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()
        const asset = await prisma.dbAsset.findFirst({
          where: {
            id: input.id,
            assetType: 'icon',
          },
          select: { content: true, mimeType: true, name: true },
        })
        if (!asset) {
          throw new Error('Icon not found')
        }
        // Return base64 encoded content
        return {
          content: Buffer.from(asset.content).toString('base64'),
          mimeType: asset.mimeType,
          name: asset.name,
        }
      }),
  })
}
