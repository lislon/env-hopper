import { EhBackendIndexCommon } from '../common/indexCommon';
import { EhEnvIndexed } from '../commonTypes';
import { EhMetaDictionary, EhBackendUiDefaultsInput, EhBackendCredentialInput } from './common';


export interface EhBackendVersionsRequestParams {
  envNames: string[];
  appNames: string[];
}

export interface EhBackendVersionsReturn {
  envIds: string[];
  appIds: string[];
}

export interface EhAppPageIndexed {
  slug: string;
  title?: string;
  url: string;
  tags?: Tag[];
}

export interface EhBackendPageInput extends EhAppPageIndexed {
  slug: string;
  title?: string;
  url: string;
  credentialsRefs?: string[];
}

export type Tag = string;

export interface EhAppGroupIndexed {
  slug: string;
  displayName: string;
  pages: EhAppPageIndexed[];
  tags?: Tag[];
}

export interface EhBackendGroupInput extends EhAppGroupIndexed {
  slug: string;
  displayName: string;
  defaults?: EhBackendUiDefaultsInput;
  pages: EhBackendPageInput[];
}

export interface EhBackendAppUIBaseInput {
  credentials?: EhBackendCredentialInput[];
  defaults?: EhBackendUiDefaultsInput;
}

export interface EhAppUiIndexed {
  groups: EhAppGroupIndexed[];
}

export interface EhBackendAppUIInput extends EhBackendAppUIBaseInput, EhAppUiIndexed {
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

export interface EhAppIndexed {
  slug: string;
  displayName: string;
  abbr?: string;
  aliases?: string[];
  ui?: EhAppUiIndexed;
  tags?: Tag[];
  iconName?: string;
  meta?: EhMetaDictionary;
}

export interface EhBackendAppInput extends EhAppIndexed {
  ui?: EhBackendAppUIInput;
  dataSources?: EhBackendDataSourceInput[];
}

export interface EhContextIndexed {
  slug: string;
  displayName: string;
  /**
   * The value is shared across envs (By default: false)
   */
  isSharedAcrossEnvs?: boolean;
  defaultFixedValues?: string[];
}
/**
 * Resouces like kafka topics, database tables, etc.
 */
export interface EhResourceIndexed {
  slug: string;
  displayName: string;
  defaultFixedValues?: string[];
}
export type EhBackendAppDto = EhAppIndexed;

export interface EhAppsMeta {
  defaultIcon?: string;
  tags: EhBackendTagsDescriptionDataIndexed;
}

export interface EhBackendIndexDataReturn extends EhBackendIndexCommon {
  envsXApps: [string, string][];
}

export interface EhBackendCompanySpecificBackend {
  getIndexData: () => Promise<EhBackendIndexDataReturn>;
  getDeployments: (params: EhBackendVersionsRequestParams) => Promise<EhBackendVersionsReturn>;
}
