import { EhBackendIndexCommon } from './common/indexCommon';
import { EhAppIndexed, EhMetaDictionary, EhBackendTagsDescriptionDataIndexed } from './backend';

export * from './common/indexCommon';

export interface EhAppLinkType {
  typeId: string;
  iconId: string;
  title: string;
  urlDecoded: string;
}

export interface EhEnvIndexed {
  slug: string;
  displayName: string;
  meta?: EhMetaDictionary;
}

export type EhAppDto = EhAppIndexed;
export type EhTagsDescriptionDto = EhBackendTagsDescriptionDataIndexed;

// const packedId = (appId << 16) + envId;
export type EhAppEnvLinkPacked = [string, string][];

export interface EhIndexData extends EhBackendIndexCommon {
  envsXApps: EhAppEnvLinkPacked;
}

