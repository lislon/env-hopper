import type { TRPCRootObject } from '@trpc/server'
import { z } from 'zod'
import { getDbClient } from '../../db'
import type { EhTrpcContext } from '../../server/ehTrpcContext'

// Zod schema for access method (simplified for now - you can expand this)
const AccessMethodSchema = z.object({
  type: z.enum(['bot', 'ticketing', 'email', 'self-service', 'documentation', 'manual']),
}).passthrough()

const AppLinkSchema = z.object({
  displayName: z.string().optional(),
  url: z.string().url(),
})

const AppRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
})

const ApproverSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

const CreateAppForCatalogSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(1),
  description: z.string(),
  access: AccessMethodSchema,
  teams: z.array(z.string()).optional(),
  roles: z.array(AppRoleSchema).optional(),
  approver: ApproverSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  appUrl: z.string().url().optional(),
  links: z.array(AppLinkSchema).optional(),
  iconName: z.string().optional(),
  screenshotIds: z.array(z.string()).optional(),
})

const UpdateAppForCatalogSchema = CreateAppForCatalogSchema.partial().extend({
  id: z.string(),
})

export function createAppCatalogAdminRouter(t: TRPCRootObject<EhTrpcContext, {}, {}>) {
  const router = t.router
  const publicProcedure = t.procedure

  return router({
    list: publicProcedure.query(async () => {
      const prisma = getDbClient()
      return prisma.dbAppForCatalog.findMany({
        orderBy: { displayName: 'asc' },
      })
    }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAppForCatalog.findUnique({
          where: { id: input.id },
        })
      }),

    create: publicProcedure
      .input(CreateAppForCatalogSchema)
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        const { approver, ...rest } = input

        return prisma.dbAppForCatalog.create({
          data: {
            ...rest,
            approverName: approver?.name ?? null,
            approverEmail: approver?.email ?? null,
            teams: input.teams ?? [],
            tags: input.tags ?? [],
            screenshotIds: input.screenshotIds ?? [],
          },
        })
      }),

    update: publicProcedure
      .input(UpdateAppForCatalogSchema)
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        const { id, approver, ...rest } = input

        return prisma.dbAppForCatalog.update({
          where: { id },
          data: {
            ...rest,
            ...(approver !== undefined && {
              approverName: approver.name || null,
              approverEmail: approver.email || null,
            }),
          },
        })
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAppForCatalog.delete({
          where: { id: input.id },
        })
      }),
  })
}
