export interface EhBackendApi {
  updateAppsAndContexts: (apps:  EhBackendAppInput[], ctxs:  EhBackendContextInput[]) => Promise<void>;
  updateEnvironments: (environments: EhBackendEnvironmentInput[]) => Promise<void>;
}

export interface EhBackendEnvironmentInput {
  id: string;
  displayName?: string;
  description?: string;
  meta?: EhBackendGenericMetaInput;
}

export type EhBackendPageInput = {
  id: string;
  title?: string;
  url: string;
  credentialsRefs?: string[];
};

type EhBackendUiDefaultsInput = {
  credentialsRefs: string[];
};

export type EhBackendGroupInput = {
  id: string;
  displayName: string;
  defaults?: EhBackendUiDefaultsInput;
  pages: EhBackendPageInput[];
};

export type EhBackendCredentialInput = {
  id: string;
  desc?: string;
  username: string;
  password: string;
};

export type EhBackendAppUIBaseInput = {
  credentials?: EhBackendCredentialInput[];
  defaults?: EhBackendUiDefaultsInput;
}

export type EhBackendAppUIInput = EhBackendAppUIBaseInput  & ({
  groups: EhBackendGroupInput[];
} | {
  pages: EhBackendPageInput[];
});

export type EhBackendGenericMetaInput<T = string | Record<string, string>> = {
  [key: string]: T | EhBackendGenericMetaInput<T>;
};

export type EhBackendDeployableInput = {
  id: string;
  meta?: {
    config: string;
  };
};

export type EhBackendAppInput = {
  id: string;
  displayName: string;
  abbr: string;
  ui: EhBackendAppUIInput;
  meta?: EhBackendGenericMetaInput;
  deployables: EhBackendDeployableInput[];
  dataSources?: EhBackendDataSourceInput[];
};




export type EhBackendDataSourceInputCommon = {
  meta?: EhBackendGenericMetaInput;

}

export type EhBackendDataSourceInputDb = {
  id?: string;
  type: 'db';
  url: string;
  username: string;
  password: string;
};

export type EhBackendDataSourceInputKafka = {
  id?: string;
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
  id: string;
  displayName: string;
  /**
   * The value is shared across envs (By default: false)
   */
  isSharedAcrossEnvs?: boolean;
}

