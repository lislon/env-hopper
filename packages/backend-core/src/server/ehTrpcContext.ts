import type { EhBackendCompanySpecificBackend } from '../types'
import type { User } from 'better-auth/types'
import type { Catalog } from '../catalog'

export interface EhTrpcContext {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user: User | null
  adminGroups: Array<string>
  /** The deployment catalog, when the deployment keeps one. */
  catalog: Catalog | null
}

export interface EhTrpcContextOptions {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user?: User | null
  adminGroups: Array<string>
  catalog?: Catalog | null
}

export function createEhTrpcContext({
  companySpecificBackend,
  user = null,
  adminGroups,
  catalog = null,
}: EhTrpcContextOptions): EhTrpcContext {
  return {
    companySpecificBackend,
    user,
    adminGroups,
    catalog,
  }
}
