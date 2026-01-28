import type { EhBackendCompanySpecificBackend } from '../types'
import type { User } from 'better-auth/types'

export interface EhTrpcContext {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user: User | null
}

export interface EhTrpcContextOptions {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user?: User | null
}

export function createEhTrpcContext({
  companySpecificBackend,
  user = null,
}: EhTrpcContextOptions): EhTrpcContext {
  return {
    companySpecificBackend,
    user,
  }
}
