import { EhApp, EhAppId, EhEnv, EhEnvId, EhSubstitutionId } from '@env-hopper/types';

export interface EhSubstitutionValue {
  id: EhSubstitutionId;
  value: string;
}

export interface EhJumpHistory {
  app: EhAppId;
  env: EhEnvId;
  substitution?: EhSubstitutionValue;
}

export interface EhJumpParams {
  app: EhApp;
  env: EhEnv;
  substitution?: EhSubstitutionValue;
}
