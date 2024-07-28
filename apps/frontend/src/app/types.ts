import {
  EhApp,
  EhAppId,
  EhEnv,
  EhEnvId,
  EhSubstitutionId,
} from '@env-hopper/types';

export interface EhSubstitutionValue {
  name: EhSubstitutionId;
  value: string;
}

export interface EhJumpHistory {
  app?: EhAppId;
  env?: EhEnvId;
  substitution?: string;
  url: string;
}

export interface EhJumpParams {
  app?: EhApp;
  env?: EhEnv;
  substitution?: EhSubstitutionValue;
}
