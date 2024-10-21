import { Dispatch, SetStateAction } from 'react';

export interface EhEnv {
  id: EhEnvId;
  meta: Record<string, string>;
}
export interface EhApp {
  id: EhAppId;
  appTitle: string;
  pageTitle?: string;
  abbr?: string;
  aliases: string[];
  url: string;
  meta: EhAppMeta;
}

export type EhAppMeta =
  | {
      ui?: EhAppWidgetUiCreds;
      db?: EhAppWidgetDbCreds;
    }
  | undefined;

/**
 * Hint for the user what the username and password are.
 */
export interface EhAppWidgetUiCreds {
  username: string;
  password: string;
}

export interface EhAppWidgetDbCreds {
  url: string;
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

/**
 * Last used substitutions for the app.
 */
export type EhLastUsedSubs = Record<EhSubstitutionId, string>;

export interface EhClientConfig {
  envs: EhEnv[];
  apps: EhApp[];
  substitutions: EhSubstitutionType[];
  appVersion: string;
  forceRefresh?: true;
}

export interface EhCustomPartUnstable {
  slidesHtml?: string[];
}

export interface EhCustomization extends EhCustomPartUnstable {
  footerHtml: string;
  analyticsScript: string;
}

export type Updater<S> = Dispatch<SetStateAction<S>>;
