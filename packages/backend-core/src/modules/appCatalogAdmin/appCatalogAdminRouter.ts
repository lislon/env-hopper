import { z } from 'zod'
import { getDbClient } from '../../db'
import { adminProcedure, router } from '../../server/trpcSetup'

// Zod schema for access method (simplified for now - you can expand this)
const AccessMethodSchema = z
  .object({
    type: z.enum([
      'bot',
      'ticketing',
      'email',
      'self-service',
      'documentation',
      'manual',
    ]),
  })
  .passthrough()

const AppLinkSchema = z.object({
  displayName: z.string().optional(),
  url: z.string().url(),
})

// New AppApprovalDetails schema
const AppRoleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

const ApproverContactSchema = z.object({
  displayName: z.string(),
  contact: z.string().optional(),
})

const ApprovalUrlSchema = z.object({
  label: z.string().optional(),
  url: z.string().url(),
})

const AppApprovalDetailsSchema = z.object({
  approvalMethodId: z.string(),
  comments: z.string().optional(),
  requestPrompt: z.string().optional(),
  postApprovalInstructions: z.string().optional(),
  roles: z.array(AppRoleSchema).optional(),
  approvers: z.array(ApproverContactSchema).optional(),
  urls: z.array(ApprovalUrlSchema).optional(),
  whoToReachOut: z.string().optional(),
})

const CreateAppForCatalogSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(1),
  description: z.string(),
  access: AccessMethodSchema.optional(),
  teams: z.array(z.string()).optional(),
  approvalDetails: AppApprovalDetailsSchema.optional(),
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

export function createAppCatalogAdminRouter() {
  return router({
    list: adminProcedure.query(async () => {
      const prisma = getDbClient()
      return prisma.dbAppForCatalog.findMany({
        orderBy: { displayName: 'asc' },
      })
    }),

    getById: adminProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAppForCatalog.findUnique({
          where: { id: input.id },
        })
      }),

    getBySlug: adminProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAppForCatalog.findUnique({
          where: { slug: input.slug },
        })
      }),

    create: adminProcedure
      .input(CreateAppForCatalogSchema)
      .mutation(async ({ input }) => {
        const prisma = getDbClient()

        return prisma.dbAppForCatalog.create({
          data: {
            ...input,
            approvalDetails: input.approvalDetails as unknown as object,
            teams: input.teams ?? [],
            tags: input.tags ?? [],
            screenshotIds: input.screenshotIds ?? [],
          },
        })
      }),

    update: adminProcedure
      .input(UpdateAppForCatalogSchema)
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        const { id, ...updateData } = input

        return prisma.dbAppForCatalog.update({
          where: { id },
          data: {
            ...updateData,
            ...(updateData.approvalDetails !== undefined && {
              approvalDetails: updateData.approvalDetails as unknown as object,
            }),
          },
        })
      }),

    updateScreenshots: adminProcedure
      .input(
        z.object({
          id: z.string(),
          screenshotIds: z.array(z.string()),
        }),
      )
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAppForCatalog.update({
          where: { id: input.id },
          data: { screenshotIds: input.screenshotIds },
        })
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const prisma = getDbClient()
        return prisma.dbAppForCatalog.delete({
          where: { id: input.id },
        })
      }),
  })
}
