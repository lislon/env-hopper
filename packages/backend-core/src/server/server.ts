import { publicProcedure, router } from './trpc';
import { AnyRouter } from '@trpc/server';

export const appRouter: AnyRouter = router({
  userList: publicProcedure
    .query(async () => {
      // Retrieve users from a datasource, this is an imaginary database
      // const users = await db.user.findMany();
      return ['151'];
    }),
});

export type AppRouter = typeof appRouter;
