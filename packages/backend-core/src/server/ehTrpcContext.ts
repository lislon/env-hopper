import type { EhBackendCompanySpecificBackend } from '../types'
import type { User } from 'better-auth/types'

export interface EhTrpcContext {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user: User | null
  adminGroups: Array<string>
}

export interface EhTrpcContextOptions {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user?: User | null
  adminGroups: Array<string>
}

export function createEhTrpcContext({
  companySpecificBackend,
  user = null,
  adminGroups,
}: EhTrpcContextOptions): EhTrpcContext {
  return {
    companySpecificBackend,
    user,
    adminGroups,
  }
}
