import z from 'zod'

import { getAppCatalogData } from '../modules/appCatalog/service'
import type {
  AppCatalogData,
  BootstrapConfigData,
  ResourceJumpsData,
} from '../types'

import { createAppCatalogAdminRouter } from '../modules/appCatalogAdmin/appCatalogAdminRouter.js'
import { createApprovalMethodRouter } from '../modules/approvalMethod/approvalMethodRouter.js'
import { createScreenshotRouter } from '../modules/assets/screenshotRouter.js'
import type { BetterAuth } from '../modules/auth/auth'
import { createAuthRouter } from '../modules/auth/authRouter.js'
import { createIconRouter } from '../modules/icons/iconRouter.js'
import { publicProcedure, router, t } from './trpcSetup'

/**
 * Create the main tRPC router with optional auth instance
 * @param auth - Optional Better Auth instance for auth-related queries
 */
export function createTrpcRouter(auth?: BetterAuth) {
  return router({
    bootstrap: publicProcedure.query(
      async ({ ctx }): Promise<BootstrapConfigData> => {
        return await ctx.companySpecificBackend.getBootstrapData()
      },
    ),

    authConfig: publicProcedure.query(async ({ ctx }) => {
      return {
        adminGroups: ctx.adminGroups,
      }
    }),

    availabilityMatrix: publicProcedure.query(async ({ ctx }) => {
      return await ctx.companySpecificBackend.getAvailabilityMatrix()
    }),

    tryFindRenameRule: publicProcedure
      .input(
        z.object({
          envSlug: z.string().optional(),
          resourceSlug: z.string().optional(),
        }),
      )
      .query(async ({ input, ctx }) => {
        return await ctx.companySpecificBackend.getNameMigrations(input)
      }),

    resourceJumps: publicProcedure.query(async ({ ctx }) => {
      return await ctx.companySpecificBackend.getResourceJumps()
    }),

    resourceJumpsExtended: publicProcedure.query(async ({ ctx }) => {
      return await ctx.companySpecificBackend.getResourceJumpsExtended()
    }),
    resourceJumpBySlugAndEnv: publicProcedure
      .input(
        z.object({
          jumpResourceSlug: z.string(),
          envSlug: z.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        return filterSingleResourceJump(
          await ctx.companySpecificBackend.getResourceJumps(),
          input.jumpResourceSlug,
          input.envSlug,
        )
      }),

    appCatalog: publicProcedure.query(
      async ({ ctx }): Promise<AppCatalogData> => {
        return await getAppCatalogData(ctx.companySpecificBackend.getApps)
      },
    ),

    // Icon management routes
    icon: createIconRouter(),

    // Screenshot management routes
    screenshot: createScreenshotRouter(),

    // App catalog admin routes
    appCatalogAdmin: createAppCatalogAdminRouter(),

    // Approval method routes
    approvalMethod: createApprovalMethodRouter(),

    // Auth routes (requires auth instance)
    auth: createAuthRouter(t, auth),
  })
}

function filterSingleResourceJump(
  resourceJumps: ResourceJumpsData,
  jumpResourceSlug: string,
  envSlug: string,
): ResourceJumpsData {
  const filteredResourceJump = resourceJumps.resourceJumps.find(
    (item) => item.slug === jumpResourceSlug,
  )
  const filteredEnv = resourceJumps.envs.find((item) => item.slug === envSlug)

  return {
    resourceJumps: filteredResourceJump ? [filteredResourceJump] : [],
    envs: filteredEnv ? [filteredEnv] : [],
    lateResolvableParams: resourceJumps.lateResolvableParams,
  }
}

export type TRPCRouter = ReturnType<typeof createTrpcRouter>
