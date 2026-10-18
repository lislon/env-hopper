import z from 'zod'
import { packEnvs } from '@env-hopper/shared-core'

import type {
  BootstrapConfigData,
  BootstrapPayload,
  ResourceJumpsData,
} from '../types'

import type { BetterAuth } from '../modules/auth/auth'
import { createAuthRouter } from '../modules/auth/authRouter.js'
import { MAX_SLICE_SLUGS, MAX_USERS, pairDetails } from './pairDetails'
import { pairsWatch } from './pairsWatch'
import { publicProcedure, router, t } from './trpcSetup'

/**
 * Create the main tRPC router with optional auth instance
 * @param auth - Optional Better Auth instance for auth-related queries
 */
export function createTrpcRouter(auth?: BetterAuth) {
  return router({
    bootstrap: publicProcedure.query(
      async ({ ctx }): Promise<BootstrapPayload> =>
        packBootstrap(await ctx.companySpecificBackend.getBootstrapData()),
    ),

    authConfig: publicProcedure.query(async ({ ctx }) => {
      return {
        adminGroups: ctx.adminGroups,
      }
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

    /** One pair's details, a chunk per facet as each source answers. */
    pair: publicProcedure
      .input(z.object({ appSlug: z.string(), envSlug: z.string() }))
      .query(async function* ({ input, ctx }) {
        yield* pairDetails(ctx, {
          pair: { app: input.appSlug, env: input.envSlug },
        })
      }),

    /**
     * The details of every pair in the slices: each Environment's Apps and
     * each App's deployed Environments, a chunk per facet per pair.
     * `exceptPair` is left out: the client loads it through `pair`.
     */
    slices: publicProcedure
      .input(
        z.object({
          appSlugs: z.array(z.string()).max(MAX_SLICE_SLUGS).optional(),
          envSlugs: z.array(z.string()).max(MAX_SLICE_SLUGS).optional(),
          exceptPair: z
            .object({ appSlug: z.string(), envSlug: z.string() })
            .optional(),
        }),
      )
      .query(async function* ({ input, ctx }) {
        yield* pairDetails(ctx, {
          appSlugs: input.appSlugs ?? [],
          envSlugs: input.envSlugs ?? [],
          except: input.exceptPair && {
            app: input.exceptPair.appSlug,
            env: input.exceptPair.envSlug,
          },
        })
      }),

    /**
     * Pushed over server-sent events: the details of the pairs in these
     * slices each time the catalog changes them, as `slices` would send them.
     */
    pairsWatch: publicProcedure
      .input(
        z.object({
          appSlugs: z.array(z.string()).max(MAX_SLICE_SLUGS).optional(),
          envSlugs: z.array(z.string()).max(MAX_SLICE_SLUGS).optional(),
          lastEventId: z.string().nullish(),
        }),
      )
      .subscription(async function* ({ input, ctx, signal }) {
        yield* pairsWatch(ctx, input, signal)
      }),

    /** User profiles by username, for the rows a slice names only by username. */
    users: publicProcedure
      .input(z.object({ usernames: z.array(z.string()).max(MAX_USERS) }))
      .query(async ({ input, ctx }) =>
        ctx.catalog ? await ctx.catalog.getUsers(input.usernames) : {},
      ),

    // Auth routes (requires auth instance)
    auth: createAuthRouter(t, auth),
  })
}

const packed = new WeakMap<BootstrapConfigData, BootstrapPayload>()

/**
 * `bootstrap` as sent: only `envs` is packed; it keeps its place, `envDefaults`
 * follows last. Packed once per data object: a backend that returns the same
 * object until its data changes packs once per change.
 */
export function packBootstrap(data: BootstrapConfigData): BootstrapPayload {
  let payload = packed.get(data)
  if (!payload) {
    const { envDefaults, envs } = packEnvs(data.envs)
    payload = { ...data, envs, envDefaults }
    packed.set(data, payload)
  }
  return payload
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
