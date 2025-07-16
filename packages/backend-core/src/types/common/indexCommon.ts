import { EhAppIndexed, EhAppsMeta, EhContextIndexed, EhResourceIndexed } from '../backend';
import { EhEnvIndexed } from '../commonTypes';

export interface EhBackendIndexCommon {
  envs: Record<string, EhEnvIndexed>;
  apps: Record<string, EhAppIndexed>;
  appsMeta: EhAppsMeta
  contexts: EhContextIndexed[];
  resources: EhResourceIndexed[];
}
