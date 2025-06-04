/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />

// import { someCoreFunction } from '@env-hopper/backend-core';
import { appRouter } from '@env-hopper/backend-core';
import { AnyRouter, initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import express from 'express';
import { AppRouter } from '@env-hopper/backend-core/src';
// created for each request
const createContext = ({
                         req,
                         res,
                       }: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create();
const app = express();

const router: AnyRouter = appRouter;
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: router,
    createContext,
  }),
);
if (import.meta.env.PROD) {
  app.listen(4000);
}
export const viteNodeApp = app;
