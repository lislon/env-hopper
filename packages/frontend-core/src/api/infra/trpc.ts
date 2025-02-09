import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { TRPCRouter } from '@env-hopper/backend-core'

const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<TRPCRouter>()

export { TRPCProvider, useTRPC, useTRPCClient }
