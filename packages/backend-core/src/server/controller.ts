import { initTRPC } from '@trpc/server'
import z from 'zod'
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

  // specificEnvs: publicProcedure
  //   .query(async ({ctx}) => {
  //     return await ctx.companySpecificBackend.getDeployments({
  //       envNames: ['dev', 'prod'],
  //       appNames: ['app1', 'app2'],
  //     })
  //   }),
})

export type TRPCRouter = typeof trpcRouter
