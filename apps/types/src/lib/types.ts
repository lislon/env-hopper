export interface EhEnv {
  name: EhEnvId;
  meta: Record<string, string>;
}
export interface EhApp {
  name: EhAppId;
  url: string;
  urlPerEnv: Record<string, string>;
  meta: EhAppMeta;
}

export type EhAppMeta = EhAppMetaCredentials | EhAppMetaNote | undefined;

/**
 * Hint for the user what the username and password are.
 */
export interface EhAppMetaCredentials {
  username: string;
  password: string;
}

/**
 * Custom note for the app to be displayed to the user.
 */
export interface EhAppMetaNote {
  note: string;
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

export type EhEnvId = string;
export type EhAppId = string;
export type EhSubstitutionId = string;

export interface EhClientConfig {
  envs: EhEnv[];
  apps: EhApp[];
  substitutions: EhSubstitutionType[];
}
