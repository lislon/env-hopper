import { EhAppsMeta, EhBackendAppInputIndexed, EhBackendEnvDto } from '../backend';

export interface EhBackendIndexCommon {
  envs: EhBackendEnvDto[];
  apps: EhBackendAppInputIndexed[];
  appsMeta: EhAppsMeta
}
