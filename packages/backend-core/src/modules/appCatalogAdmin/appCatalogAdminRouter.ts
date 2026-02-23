import { z } from 'zod'
import { getDbClient } from '../../db'
import { adminProcedure, router } from '../../server/trpcSetup'
import type { AppAccessRequest } from '../../types'

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
  .loose()

const AppLinkSchema = z.object({
  displayName: z.string().optional(),
  url: z.url(),
})

// New AppAccessRequest schema
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
  url: z.url(),
})

const AppAccessRequestSchema = z.object({
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
  accessRequest: AppAccessRequestSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  appUrl: z.url().optional(),
  links: z.array(AppLinkSchema).optional(),
  iconName: z.string().optional(),
  screenshotIds: z.array(z.string()).optional(),
})

const UpdateAppForCatalogSchema = CreateAppForCatalogSchema.partial().extend({
  id: z.string(),
})

export function createAppCatalogAdminRouter() {
  const prisma = getDbClient()
  return router({
    list: adminProcedure.query(async () => {
      return prisma.dbAppForCatalog.findMany({
        orderBy: { displayName: 'asc' },
      })
    }),

    getById: adminProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return prisma.dbAppForCatalog.findUnique({
          where: { id: input.id },
        })
      }),

    getBySlug: adminProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return prisma.dbAppForCatalog.findUnique({
          where: { slug: input.slug },
        })
      }),

    create: adminProcedure
      .input(CreateAppForCatalogSchema)
      .mutation(async ({ input }) => {
        // Type assertion needed because Zod's passthrough() creates index signatures
        // that don't structurally match Prisma's typed JSON fields.
        // This is safe because Zod validates the input shape.
        return prisma.dbAppForCatalog.create({
          data: {
            slug: input.slug,
            displayName: input.displayName,
            description: input.description,
            teams: input.teams ?? [],
            accessRequest: input.accessRequest as AppAccessRequest | undefined,
            notes: input.notes,
            tags: input.tags ?? [],
            appUrl: input.appUrl,
            links: input.links as Array<{ displayName?: string; url: string }>,
            iconName: input.iconName,
            screenshotIds: input.screenshotIds ?? [],
          },
        })
      }),

    update: adminProcedure
      .input(UpdateAppForCatalogSchema)
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input

        // Type assertion needed because Zod's passthrough() creates index signatures
        return prisma.dbAppForCatalog.update({
          where: { id },
          data: {
            ...(updateData.slug !== undefined && { slug: updateData.slug }),
            ...(updateData.displayName !== undefined && {
              displayName: updateData.displayName,
            }),
            ...(updateData.description !== undefined && {
              description: updateData.description,
            }),
            ...(updateData.teams !== undefined && { teams: updateData.teams }),
            ...(updateData.accessRequest !== undefined && {
              accessRequest: updateData.accessRequest as
                | AppAccessRequest
                | undefined,
            }),
            ...(updateData.notes !== undefined && { notes: updateData.notes }),
            ...(updateData.tags !== undefined && { tags: updateData.tags }),
            ...(updateData.appUrl !== undefined && {
              appUrl: updateData.appUrl,
            }),
            ...(updateData.links !== undefined && {
              links: updateData.links as Array<{
                displayName?: string
                url: string
              }>,
            }),
            ...(updateData.iconName !== undefined && {
              iconName: updateData.iconName,
            }),
            ...(updateData.screenshotIds !== undefined && {
              screenshotIds: updateData.screenshotIds,
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
        return prisma.dbAppForCatalog.update({
          where: { id: input.id },
          data: { screenshotIds: input.screenshotIds },
        })
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return prisma.dbAppForCatalog.delete({
          where: { id: input.id },
        })
      }),
  })
}
