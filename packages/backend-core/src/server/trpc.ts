import { initTRPC, TRPCRootObject } from '@trpc/server';
import { EhTrpcContext } from './ehTrpcContext';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t: TRPCRootObject<EhTrpcContext, {}, {}> = initTRPC.context<EhTrpcContext>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router: typeof t.router = t.router;
export const publicProcedure: typeof t.procedure = t.procedure;
