import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { TRPCRouter  } from '@env-hopper/backend-core';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<TRPCRouter>();
