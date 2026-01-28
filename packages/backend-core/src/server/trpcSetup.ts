import { TRPCError, initTRPC } from '@trpc/server'
import type { EhTrpcContext } from './ehTrpcContext'
import { isAdmin } from '../modules/auth/authorizationUtils'

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
export const t = initTRPC.context<EhTrpcContext>().create({
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
 */
export const router = t.router
export const publicProcedure = t.procedure

/**
 * Middleware to check if user is authenticated
 */
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

/**
 * Middleware to check if user is an admin
 */
const isAdminMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  if (!isAdmin(ctx.user)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an admin to access this resource',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

/**
 * Admin procedure that requires admin permissions
 */
export const adminProcedure = t.procedure.use(isAdminMiddleware)

/**
 * Protected procedure that requires authentication (but not admin)
 */
export const protectedProcedure = t.procedure.use(isAuthenticated)
