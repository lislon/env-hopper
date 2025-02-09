import type { EhBackendCompanySpecificBackend } from '../types'

export interface EhTrpcContext {
  companySpecificBackend: EhBackendCompanySpecificBackend
}

export interface EhTrpcContextOptions {
  companySpecificBackend: EhBackendCompanySpecificBackend
}

export function createEhTrpcContext({
  companySpecificBackend,
}: EhTrpcContextOptions): EhTrpcContext {
  return {
    companySpecificBackend,
  }
}

// const createContext = ({
//                          req,
//                          res
//                        }: trpcExpress.CreateExpressContextOptions) => ({}); // no context
// type Context = Awaited<ReturnType<typeof createContext>>;
