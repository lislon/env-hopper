import { initTRPC } from '@trpc/server'
import z from 'zod'
import type { ResourceJumpsData } from '../types'
import type { EhTrpcContext } from './ehTrpcContext'
import type { TRPCRootObject } from '@trpc/server'

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t: TRPCRootObject<EhTrpcContext, {}, {}> = initTRPC
  .context<EhTrpcContext>()
  .create()

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
const router: typeof t.router = t.router
const publicProcedure: typeof t.procedure = t.procedure

export const trpcRouter = router({
  bootstrap: publicProcedure.query(async ({ ctx }) => {
    return await ctx.companySpecificBackend.getBootstrapData()
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
})

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
  }
}

export type TRPCRouter = typeof trpcRouter
