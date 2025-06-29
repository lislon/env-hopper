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

import { EhBackendEnvironmentInput } from '../types/backendTypes';
import { EhIndexData } from '../types/commonTypes';

export const trpcRouter = router({
  userList: publicProcedure
    .query(async () => {
      // Retrieve users from a datasource, this is an imaginary database
      // const users = await db.user.findMany();
      return ['111'];
    }),
  envs: publicProcedure
    .query(async ({ctx}) => {
      const envs = await ctx.miniDb.get<EhBackendEnvironmentInput[]>('envs');
      // Retrieve users from a datasource, this is an imaginary database
      // const users = await db.user.findMany();
      return envs.map(env => env.slug);

    }),
  index: publicProcedure
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

