import { EhBackendGenericMetaInput } from './common';

export interface EhBackendEnvironmentInput {
  slug: string;
  displayName?: string;
  description?: string;
  meta?: EhBackendGenericMetaInput;
}

export interface EhBackendDeploymentInput {
  envId: string;
  appId: string;
  displayVersion: string;
  meta?: EhBackendGenericMetaInput;
}

export interface EhBackendDeployableInput {
  slug: string;
  meta?: {
    config: string;
  };
}

/**
 * Latest - backend returned latest data.
 * Cached - backend in process of updating data, but returned cached data.
 */
export type EhBackendDataFreshness = 'latest' | 'cached';

export interface EhBackendDataVersion {
  version: string;
  freshness: EhBackendDataFreshness;
}

export interface EhBackendDeployment {
  appName: string;
  deployableServiceName: string;
  envName: string;
  version: EhBackendDataVersion;
}
