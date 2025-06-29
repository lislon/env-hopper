import { EhAppDto, EhEnvDto } from './commonTypes';

export interface EhBackendApi {
  updateAppsAndContexts: (apps:  EhBackendAppInput[], ctxs:  EhBackendContextInput[]) => Promise<void>;
  updateEnvironments: (environments: EhBackendEnvironmentInput[]) => Promise<void>;
  updateDeployments: (deployments: EhBackendDeploymentInput[]) => Promise<void>;
}

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
export interface EhBackendPageInputIndexed {
  slug: string;
  title?: string;
  url: string;
}


export interface EhBackendPageInput extends EhBackendPageInputIndexed  {
  slug: string;
  title?: string;
  url: string;
  credentialsRefs?: string[];
}

type EhBackendUiDefaultsInput = {
  credentialsRefs: string[];
};

export interface EhBackendGroupInputIndexed {
  slug: string;
  displayName: string;
  pages: EhBackendPageInputIndexed[];
}


export interface EhBackendGroupInput extends EhBackendGroupInputIndexed  {
  slug: string;
  displayName: string;
  defaults?: EhBackendUiDefaultsInput;
  pages: EhBackendPageInput[];
}

export type EhBackendCredentialInput = {
  slug: string;
  desc?: string;
  username: string;
  password: string;
};

export type EhBackendAppUIBaseInput = {
  credentials?: EhBackendCredentialInput[];
  defaults?: EhBackendUiDefaultsInput;
}

export interface EhBackendAppUIInput extends EhBackendAppUIBaseInput, EhBackendAppUIInputIndexed {
  groups: EhBackendGroupInput[];
}

export type EhBackendGenericMetaInput<T = string | Record<string, string>> = {
  [key: string]: T | EhBackendGenericMetaInput<T>;
};

export type EhBackendDeployableInput = {
  slug: string;
  meta?: {
    config: string;
  };
};

export interface EhBackendAppInputIndexed {
  slug: string;
  displayName: string;
  abbr: string;
  ui: EhBackendAppUIInputIndexed;

}

export interface EhBackendAppUIInputIndexed {
  groups: EhBackendGroupInputIndexed[];
}

export interface EhBackendAppInput extends EhBackendAppInputIndexed  {
  slug: string;
  displayName: string;
  abbr: string;
  ui: EhBackendAppUIInput;
  meta?: EhBackendGenericMetaInput;
  deployables: EhBackendDeployableInput[];
  dataSources?: EhBackendDataSourceInput[];
}



export type EhBackendDataSourceInputCommon = {
  meta?: EhBackendGenericMetaInput;

}

export type EhBackendDataSourceInputDb = {
  slug?: string;
  type: 'db';
  url: string;
  username: string;
  password: string;
};

export type EhBackendDataSourceInputKafka = {
  slug?: string;
  type: 'kafka';
  topics: {
    consumer?: string[];
    producer?: string[];
  }
};

export type EhBackendDataSourceInput = EhBackendDataSourceInputCommon & (
  EhBackendDataSourceInputDb | EhBackendDataSourceInputKafka
  );

export type EhBackendContextInput  = {
  slug: string;
  displayName: string;
  /**
   * The value is shared across envs (By default: false)
   */
  isSharedAcrossEnvs?: boolean;
}

/**
 * Latest - backend returned latest data.
 * Cached - backend in process of updating data, but returned cached data.
 */
export type EhBackendDataFreshness = 'latest' | 'cached';


export type EhBackendDataVersion = {
  version: string;
  freshness: EhBackendDataFreshness;
}

export type EhBackendDeployment = {
  appName: string;
  deployableServiceName: string;
  envName: string;
  version: EhBackendDataVersion;
}

export type EhBackendVersionsRequestParams = {
  envNames: string[]
  appNames: string[];
}

export type EhBackendVersionsReturn = {
  envIds: string[]
  appIds: string[];
}

export type EhBackendAppDto = EhAppDto;
export type EhBackendEnvDto = EhEnvDto;

export interface EhBackendIndexDataReturn {
 envs: EhBackendEnvDto[]
 apps:  EhBackendAppInputIndexed[]
 envsXApps: [string, string][];
}


export interface EhBackendCompanySpecificBackend {
  getIndexData: () => Promise<EhBackendIndexDataReturn>;
  getDeployments: (params: EhBackendVersionsRequestParams) => Promise<EhBackendVersionsReturn>;
}
