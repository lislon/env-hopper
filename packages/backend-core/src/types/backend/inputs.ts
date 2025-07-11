import { EhBackendCredentialInput, EhBackendGenericMetaInput, EhBackendUiDefaultsInput } from './common';
import { EhBackendDeployableInput, EhBackendDeploymentInput, EhBackendEnvironmentInput } from './deployments';
import { EhBackendDataSourceInput } from './dataSources';

export type Tag = string;

export interface EhBackendPageInputIndexed {
  slug: string;
  title?: string;
  url: string;
  tags?: Tag[];
}

export interface EhBackendPageInput extends EhBackendPageInputIndexed {
  slug: string;
  title?: string;
  url: string;
  credentialsRefs?: string[];
}

export interface EhBackendGroupInputIndexed {
  slug: string;
  displayName: string;
  pages: EhBackendPageInputIndexed[];
  tags?: Tag[];
}

export interface EhBackendGroupInput extends EhBackendGroupInputIndexed {
  slug: string;
  displayName: string;
  defaults?: EhBackendUiDefaultsInput;
  pages: EhBackendPageInput[];
}

export interface EhBackendAppUIBaseInput {
  credentials?: EhBackendCredentialInput[];
  defaults?: EhBackendUiDefaultsInput;
}

export interface EhBackendAppUIInputIndexed {
  groups: EhBackendGroupInputIndexed[];
}

export interface EhBackendAppUIInput extends EhBackendAppUIBaseInput, EhBackendAppUIInputIndexed {
  groups: EhBackendGroupInput[];
}

export interface EhBackendTagsDescriptionDataIndexed {
  descriptions: EhBackendTagDescriptionDataIndexed[];
}

export interface EhBackendTagDescriptionDataIndexed {
  tagKey: string;
  displayName?: string;
  fixedTagValues?: EhBackendTagFixedTagValue[];
}

export interface EhBackendTagFixedTagValue {
  tagValue: string;
  displayName: string;
}

export interface EhBackendAppInputIndexed {
  slug: string;
  displayName: string;
  abbr?: string;
  aliases?: string[];
  ui?: EhBackendAppUIInputIndexed;
  tags?: Tag[];
  iconName?: string;
  meta?: EhBackendGenericMetaInput;
}

export interface EhBackendAppInput extends EhBackendAppInputIndexed {
  ui?: EhBackendAppUIInput;
  dataSources?: EhBackendDataSourceInput[];
}

export type EhBackendContextIndexed = {
  slug: string;
  displayName: string;
  /**
   * The value is shared across envs (By default: false)
   */
  isSharedAcrossEnvs?: boolean;
  defaultFixedValues?: string[];
};

/**
 * Resouces like kafka topics, database tables, etc.
 */
export type EhBackendResourceIndexed = {
  slug: string;
  displayName: string;
  defaultFixedValues?: string[];
};

// Re-export for convenience
export type { EhBackendEnvironmentInput, EhBackendDeploymentInput };
