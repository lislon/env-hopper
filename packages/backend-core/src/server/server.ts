import { publicProcedure, router } from './trpc';
import { AnyTRPCRouter } from '@trpc/server';
import { miniDb } from './mini-db';
import { EhBackendEnvironmentInput } from './backendTypes';

export const trpcRouter: AnyTRPCRouter = router({
  userList: publicProcedure
    .query(async () => {
      // Retrieve users from a datasource, this is an imaginary database
      // const users = await db.user.findMany();
      return ['111'];
    }),
  envs: publicProcedure
    .query(async () => {
      const envs = await miniDb.get<EhBackendEnvironmentInput[]>('envs');
      // Retrieve users from a datasource, this is an imaginary database
      // const users = await db.user.findMany();
      return envs.map(env => env.id);
    }),
});

export type TRPCRouter = typeof trpcRouter;
