import { EhAppsMeta, EhBackendAppInputIndexed, EhBackendContextIndexed, EhBackendEnvDto, EhBackendResourceIndexed } from '../backend';

export interface EhBackendIndexCommon {
  envs: Record<string, EhBackendEnvDto>;
  apps: Record<string, EhBackendAppInputIndexed>;
  appsMeta: EhAppsMeta
  contexts: EhBackendContextIndexed[];
  resources: EhBackendResourceIndexed[];
}
