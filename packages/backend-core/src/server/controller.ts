import { initTRPC } from '@trpc/server'
import z from 'zod'

import { getAppCatalogData } from '../modules/appCatalog/service'
import type { AppCatalogData, BootstrapConfigData, ResourceJumpsData } from '../types'

import type { TRPCRootObject } from '@trpc/server'

import { createAppCatalogAdminRouter } from '../modules/appCatalogAdmin/appCatalogAdminRouter.js'
import { createScreenshotRouter } from '../modules/assets/screenshotRouter.js'
import type { BetterAuth } from '../modules/auth/auth'
import { createAuthRouter } from '../modules/auth/authRouter.js'
import { createIconRouter } from '../modules/icons/iconRouter.js'
import type { EhTrpcContext } from './ehTrpcContext'

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t: TRPCRootObject<EhTrpcContext, {}, {}> = initTRPC
  .context<EhTrpcContext>()
  .create({
    errorFormatter({ error, shape }: { error: unknown; shape: unknown }) {
      // Log all tRPC errors to console
      console.error('[tRPC Error]', {
        path: (shape as { data?: { path?: string } }).data?.path,
        code: (error as { code?: string }).code,
        message: (error as { message?: string }).message,
        cause: (error as { cause?: unknown }).cause,
        stack: (error as { stack?: string }).stack,
      })
      return shape
    },
  })

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
const router: typeof t.router = t.router
const publicProcedure: typeof t.procedure = t.procedure

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

    appCatalog: publicProcedure.query(async ({ ctx }): Promise<AppCatalogData> => {
      return await getAppCatalogData(ctx.companySpecificBackend.getApps)
    }),

    // Icon management routes
    icon: createIconRouter(t),

    // Screenshot management routes
    screenshot: createScreenshotRouter(t),

    // App catalog admin routes
    appCatalogAdmin: createAppCatalogAdminRouter(t),

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
