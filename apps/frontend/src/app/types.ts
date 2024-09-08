/// <reference types="vite-plugin-pwa/client" />
import {
  EhApp,
  EhAppId,
  EhClientConfig,
  EhCustomization,
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

export interface EhMainLoaderData {
  config: Promise<EhClientConfig>;
  customization: Promise<EhCustomization>;
}
