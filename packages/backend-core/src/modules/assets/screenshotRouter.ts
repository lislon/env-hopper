import { z } from 'zod'
import { getDbClient } from '../../db'
import { publicProcedure, router } from '../../server/trpcSetup'

export function createScreenshotRouter() {
  return router({
    list: publicProcedure.query(async () => {
      const prisma = getDbClient()
      return prisma.dbAsset.findMany({
        where: { assetType: 'screenshot' },
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
        orderBy: { createdAt: 'desc' },
      })
    }),

    getOne: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAsset.findFirst({
          where: {
            id: input.id,
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
            updatedAt: true,
          },
        })
      }),

    getByAppSlug: publicProcedure
      .input(z.object({ appSlug: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()

        // Find app by slug
        const app = await prisma.dbAppForCatalog.findUnique({
          where: { slug: input.appSlug },
          select: { screenshotIds: true },
        })

        if (!app) {
          return []
        }

        // Fetch all screenshots for the app
        return prisma.dbAsset.findMany({
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
            updatedAt: true,
          },
        })
      }),

    getFirstByAppSlug: publicProcedure
      .input(z.object({ appSlug: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()

        // Find app by slug
        const app = await prisma.dbAppForCatalog.findUnique({
          where: { slug: input.appSlug },
          select: { screenshotIds: true },
        })

        if (!app || app.screenshotIds.length === 0) {
          return null
        }

        // Fetch first screenshot
        return prisma.dbAsset.findUnique({
          where: { id: app.screenshotIds[0] },
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
      }),
  })
}
