import { EhBackendIndexCommon } from './common/indexCommon';
import { EhBackendAppInputIndexed, EhBackendGenericMetaInput, EhBackendTagsDescriptionDataIndexed } from './backend';

export * from './common/indexCommon';

export interface EhAppLinkType {
  typeId: string;
  iconId: string;
  title: string;
  urlDecoded: string;
}

export interface EhEnvDto {
  slug: string;
  displayName: string;
  meta?: EhBackendGenericMetaInput;
}

export type EhAppDto = EhBackendAppInputIndexed;
export type EhTagsDescriptionDto = EhBackendTagsDescriptionDataIndexed;

// const packedId = (appId << 16) + envId;
export type EhAppEnvLinkPacked = [string, string][];

export interface EhIndexData extends EhBackendIndexCommon {
  envsXApps: EhAppEnvLinkPacked;
}

