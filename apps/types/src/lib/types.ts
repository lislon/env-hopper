export interface EhEnv {
  id: EhEnvId;
  meta: Record<string, string>;
}
export interface EhApp {
  id: EhAppId;
  title: string;
  aliases: string[];
  url: string;
  meta: EhAppMeta;
}

export type EhAppMeta = {
  ui?: EhAppWidgetUiCreds
  db?: EhAppWidgetDbCreds
} | undefined

/**
 * Hint for the user what the username and password are.
 */
export interface EhAppWidgetUiCreds {
  username: string;
  password: string;
}

export interface EhAppWidgetDbCreds {
  url: string
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
  id: string;
  title: string;
  /**
   * Should the value be autocomplete using native browser autocomplete.
   */
  isBrowserAutocomplete?: boolean;
  /**
   * The value is shared across envs (By default: false)
   */
  isSharedAcrossEnvs?: boolean;
}

export type EhEnvId = string;
export type EhAppId = string;
export type EhPageId = string;
export type EhSubstitutionId = string;

export interface EhClientConfig {
  envs: EhEnv[];
  apps: EhApp[];
  substitutions: EhSubstitutionType[];
  appVersion: string
  customFooterHtml?: string
}
