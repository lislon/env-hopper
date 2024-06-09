import { EhApp, EhAppId, EhEnv, EhEnvId, EhSubstitutionId } from '@env-hopper/types';

export interface EhSubstitutionValue {
  name: EhSubstitutionId;
  value: string;
}

export interface EhJumpHistory {
  app?: EhAppId;
  env?: EhEnvId;
  substitution?: string;
}

export interface EhJumpParams {
  app?: EhApp;
  env?: EhEnv;
  substitution?: EhSubstitutionValue;
}

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
