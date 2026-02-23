import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getDbClient } from '../../db'
import { adminProcedure, publicProcedure, router } from '../../server/trpcSetup'
import type {
  ApprovalMethod,
  ApprovalMethodConfig,
  CustomConfig,
  PersonTeamConfig,
  ServiceConfig,
} from '../../types'
import { generateSlugFromDisplayName } from './slugUtils'

// Zod schemas
const ReachOutContactSchema = z.object({
  displayName: z.string(),
  contact: z.string(),
})

const ServiceConfigSchema = z.object({
  url: z.url().optional(),
  icon: z.string().optional(),
})

const PersonTeamConfigSchema = z.object({
  reachOutContacts: z.array(ReachOutContactSchema).optional(),
})

const CustomConfigSchema = z.object({})

const ApprovalMethodConfigSchema = z.union([
  ServiceConfigSchema,
  PersonTeamConfigSchema,
  CustomConfigSchema,
])

const CreateApprovalMethodSchema = z.object({
  type: z.enum(['service', 'personTeam', 'custom']),
  displayName: z.string().min(1),
  config: ApprovalMethodConfigSchema.optional(),
})

const UpdateApprovalMethodSchema = z.object({
  slug: z.string(),
  type: z.enum(['service', 'personTeam', 'custom']).optional(),
  displayName: z.string().min(1).optional(),
  config: ApprovalMethodConfigSchema.optional(),
})

/**
 * Convert Prisma DbApprovalMethod to our ApprovalMethod type.
 * This ensures tRPC infers proper types for frontend consumers.
 */
function toApprovalMethod(db: {
  slug: string
  type: ApprovalMethod['type']
  displayName: string
  config: ApprovalMethodConfig | null
  createdAt: Date
  updatedAt: Date
}): ApprovalMethod {
  // Handle discriminated union by explicitly narrowing based on type
  const baseFields = {
    slug: db.slug,
    displayName: db.displayName,
    createdAt: db.createdAt,
    updatedAt: db.updatedAt,
  }

  // Provide default empty config if null, as ApprovalMethod discriminated union requires config
  const config = db.config ?? {}

  switch (db.type) {
    case 'service':
      return { ...baseFields, type: 'service', config: config as ServiceConfig }
    case 'personTeam':
      return {
        ...baseFields,
        type: 'personTeam',
        config: config as PersonTeamConfig,
      }
    case 'custom':
      return { ...baseFields, type: 'custom', config: config as CustomConfig }
  }
}

export function createApprovalMethodRouter() {
  return router({
    // Public: list for selection in app admin
    list: publicProcedure.query(async (): Promise<Array<ApprovalMethod>> => {
      const prisma = getDbClient()
      const results = await prisma.dbApprovalMethod.findMany({
        orderBy: { displayName: 'asc' },
      })
      return results.map(toApprovalMethod)
    }),

    // Public: get by ID
    getById: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }): Promise<ApprovalMethod | null> => {
        const prisma = getDbClient()
        const result = await prisma.dbApprovalMethod.findUnique({
          where: { slug: input.slug },
        })
        return result ? toApprovalMethod(result) : null
      }),

    // Admin: create
    create: adminProcedure
      .input(CreateApprovalMethodSchema)
      .mutation(async ({ input }): Promise<ApprovalMethod> => {
        const prisma = getDbClient()
        const result = await prisma.dbApprovalMethod.create({
          data: {
            slug: generateSlugFromDisplayName(input.displayName),
            type: input.type,
            displayName: input.displayName,
            config: input.config ?? Prisma.JsonNull,
          },
        })
        return toApprovalMethod(result)
      }),

    // Admin: update
    update: adminProcedure
      .input(UpdateApprovalMethodSchema)
      .mutation(async ({ input }): Promise<ApprovalMethod> => {
        const prisma = getDbClient()
        const { slug, ...updateData } = input
        const result = await prisma.dbApprovalMethod.update({
          where: { slug },
          data: {
            ...(updateData.type !== undefined && { type: updateData.type }),
            ...(updateData.displayName !== undefined && {
              displayName: updateData.displayName,
            }),
            ...(updateData.config !== undefined && {
              config: updateData.config ?? Prisma.JsonNull,
            }),
          },
        })
        return toApprovalMethod(result)
      }),

    // Admin: delete
    delete: adminProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }): Promise<ApprovalMethod> => {
        const prisma = getDbClient()
        const result = await prisma.dbApprovalMethod.delete({
          where: { slug: input.slug },
        })
        return toApprovalMethod(result)
      }),

    // Admin: search by type
    listByType: publicProcedure
      .input(z.object({ type: z.enum(['service', 'personTeam', 'custom']) }))
      .query(async ({ input }): Promise<Array<ApprovalMethod>> => {
        const prisma = getDbClient()
        const results = await prisma.dbApprovalMethod.findMany({
          where: { type: input.type },
          orderBy: { displayName: 'asc' },
        })
        return results.map(toApprovalMethod)
      }),
  })
}
