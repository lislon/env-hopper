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
// Named here so the router's declaration can name a `pairsWatch` event.
import type { TrackedData } from '@trpc/server/unstable-core-do-not-import'
import type { PairChunk } from './pairDetails'
import { publicProcedure, router, t } from './trpcSetup'
import type { EhTrpcContext } from './ehTrpcContext'

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

    /**
     * One pair's details, a chunk per facet as each source answers. Someone
     * looks at it: the deployment's backend is told to warm it.
     */
    pair: publicProcedure
      .input(z.object({ appSlug: z.string(), envSlug: z.string() }))
      .query(async function* ({ input, ctx }) {
        warm(ctx, input, 'view')
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

    /**
     * A change request's description, asked when its dialog opens: the
     * first `CHANGE_REQUEST_DESCRIPTION_MAX` characters, `''` when unknown.
     */
    changeRequestDetails: publicProcedure
      .input(
        z.object({
          appSlug: z.string(),
          componentSlug: z.string(),
          id: z.string().regex(/^\d+$/),
        }),
      )
      .query(async ({ input, ctx }) => {
        const details =
          await ctx.companySpecificBackend.getChangeRequestDetails?.(input)
        const description = details?.description ?? ''
        return {
          description:
            description.length > CHANGE_REQUEST_DESCRIPTION_MAX
              ? `${description.slice(0, CHANGE_REQUEST_DESCRIPTION_MAX)}…`
              : description,
        }
      }),

    /** What a User does, kept, and the AppEnv it shows warmed (ADR 0006). */
    usage: router({
      record: publicProcedure
        .input(
          z.object({
            kind: z.enum(['open', 'jump']),
            appSlug: z.string().max(200),
            envSlug: z.string().max(200),
            resourceJump: z.string().max(200).optional(),
            url: z.string().max(2000).optional(),
            /** The id the previous UI kept for this browser: the first record names the browser by it. */
            legacyUserId: z.string().max(64).optional(),
            /** The browser's id for this event: a retried send is kept once. */
            eventId: z.string().uuid().optional(),
            /** When the User did it, by the browser. */
            at: z.string().datetime().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          const { legacyUserId, at, ...event } = input
          if (event.kind === 'jump') warm(ctx, event, 'jump')
          if (!ctx.ehUser || !ctx.catalog) return
          await ctx.catalog.recordUserEvent({
            ehUserId: ctx.ehUser.name(legacyUserId),
            ...(ctx.user && { userId: ctx.user.id }),
            ...event,
            ...(at && { at: clampEventTime(new Date(at)) }),
          })
        }),
    }),

    // Auth routes (requires auth instance)
    auth: createAuthRouter(t, auth),
  })
}

/** A browser's clock may be off: an event time is kept within a day before and 5 minutes after now. */
function clampEventTime(at: Date, now = new Date()): Date {
  const earliest = now.getTime() - 24 * 3_600_000
  const latest = now.getTime() + 5 * 60_000
  return new Date(Math.min(Math.max(at.getTime(), earliest), latest))
}

/** Tells the deployment's backend someone looks at the AppEnv; never fails the call. */
function warm(
  ctx: EhTrpcContext,
  { appSlug, envSlug }: { appSlug: string; envSlug: string },
  reason: string,
) {
  try {
    ctx.companySpecificBackend.warm?.([{ appSlug, envSlug }], reason)
  } catch (e) {
    console.error('[warm] failed', e)
  }
}

/** A change request's description is sent up to this many characters. */
export const CHANGE_REQUEST_DESCRIPTION_MAX = 2048

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

/** One `pairsWatch` event as the client receives it: its id and chunks. */
export type PairsWatchEvent = TrackedData<Array<PairChunk>>
