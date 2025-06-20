import { publicProcedure, router } from './trpc';
import { EhBackendEnvironmentInput } from '../types/backendTypes';

export const trpcRouter: ReturnType<typeof router> = router({
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
      return await ctx.companySpecificBackend.getIndexData()
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

