// Superseded by the deployment catalog; kept so existing imports still compile.
import type { EhMetaDictionary } from '../common/sharedTypes'

/** @deprecated Use the catalog API: `CatalogEnvironmentInput` with `createCatalog`. */
export interface EhBackendEnvironmentInput {
  slug: string
  displayName?: string
  description?: string
  meta?: EhMetaDictionary
}

/** @deprecated Use the catalog API: `CatalogDeploymentInput` with `createCatalog`. */
export interface EhBackendDeploymentInput {
  envId: string
  appId: string
  displayVersion: string
  meta?: EhMetaDictionary
}

/** @deprecated Use the catalog API: `CatalogComponentInput` with `createCatalog`. */
export interface EhBackendDeployableInput {
  slug: string
  meta?: {
    config: string
  }
}

/**
 * Latest - backend returned latest data.
 * Cached - backend in process of updating data, but returned cached data.
 * @deprecated Use the catalog API: `CatalogDeploymentView` from `Catalog.listDeployments`.
 */
export type EhBackendDataFreshness = 'latest' | 'cached'

/** @deprecated Use the catalog API: `CatalogArtifactView` from `Catalog.listDeployments`. */
export interface EhBackendDataVersion {
  version: string
  freshness: EhBackendDataFreshness
}

/** @deprecated Use the catalog API: `CatalogDeploymentView` from `Catalog.listDeployments`. */
export interface EhBackendDeployment {
  appName: string
  deployableServiceName: string
  envName: string
  version: EhBackendDataVersion
}
