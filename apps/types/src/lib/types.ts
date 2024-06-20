export interface EhEnv {
  name: EhEnvId;
  meta: Record<string, string>;
}
export interface EhApp {
  name: EhAppId;
  url: string;
  urlPerEnv: Record<string, string>;
}

export interface EhSubstitutionType {
  name: string;
  title: string;
  /**
   * Should the value be autocompletable using native browser autocomplete.
   */
  isBrowserAutocomplete?: boolean;
  /**
   * The value is shared across envs (By default: false)
   */
  isSharedAcrossEnvs?: boolean;
}

export type EhSubstitutionValue = string;

export type EhEnvId = string;
export type EhAppId = string;
export type EhSubstitutionId = string;

export interface EhClientConfig {
  envs: EhEnv[];
  apps: EhApp[];
  substitutions: EhSubstitutionType[];
}
