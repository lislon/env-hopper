import { EhBackendCompanySpecificBackend } from '../types/backendTypes';
import { miniDb, MiniDB } from './mini-db';

export interface EhTrpcContext {
  companySpecificBackend: EhBackendCompanySpecificBackend;
  miniDb: MiniDB;
}

export interface EhTrpcContextOptions {
  companySpecificBackend: EhBackendCompanySpecificBackend;
}

export function createEhTrpcContext({ companySpecificBackend }: EhTrpcContextOptions): EhTrpcContext {
  return {
    companySpecificBackend,
    miniDb
  };
}

// const createContext = ({
//                          req,
//                          res
//                        }: trpcExpress.CreateExpressContextOptions) => ({}); // no context
// type Context = Awaited<ReturnType<typeof createContext>>;
