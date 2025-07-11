import { EhEnvDto } from '../commonTypes';
import { EhBackendAppInputIndexed, EhBackendTagsDescriptionDataIndexed } from './inputs';
import { EhBackendIndexCommon } from '../common/indexCommon';

export interface EhBackendVersionsRequestParams {
  envNames: string[];
  appNames: string[];
}

export interface EhBackendVersionsReturn {
  envIds: string[];
  appIds: string[];
}

export type EhBackendAppDto = EhBackendAppInputIndexed;

export interface EhBackendEnvDto extends EhEnvDto {

}

export interface EhAppsMeta {
  defaultIcon?: string
  tags: EhBackendTagsDescriptionDataIndexed;
}

export interface EhBackendIndexDataReturn extends  EhBackendIndexCommon {
  envsXApps: [string, string][];
}
