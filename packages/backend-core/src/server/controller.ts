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
const router: typeof t.router = t.router;
const publicProcedure: typeof t.procedure = t.procedure;


import { EhIndexData } from '../types';

export const trpcRouter = router({
  index: publicProcedure
    .query(async ({ctx}) => {
      const ehBackendIndexDataReturn: EhIndexData = await ctx.companySpecificBackend.getIndexData();
      return ehBackendIndexDataReturn
    }),
  appCatalog: publicProcedure
    .query(async ({ctx}) => {
      const ehBackendIndexDataReturn: EhIndexData = await ctx.companySpecificBackend.getIndexData();
      return ehBackendIndexDataReturn
    }),

  specificEnvs: publicProcedure
    .query(async ({ctx}) => {
      return await ctx.companySpecificBackend.getDeployments({
        envNames: ['dev', 'prod'],
        appNames: ['app1', 'app2'],
      })
    }),

});

export type TRPCRouter = typeof trpcRouter;

