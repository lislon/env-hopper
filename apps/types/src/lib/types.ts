export type EhAppOverride = Partial<Pick<EhApp, 'meta' | 'widgets'>>;

export type EnvType = 'stage' | 'prod';

export interface EhEnv {
  id: EhEnvId;
  meta: Record<string, string>;
  appOverride?: EhAppOverride;
  envType?: EnvType;
}
export interface EhApp {
  id: EhAppId;
  appTitle: string;
  pageTitle?: string;
  abbr?: string;
  aliases: string[];
  url: string;
  meta?: EhAppMeta;
  widgets?: EhAppWidgets;
}

export interface EhAppWidgets {
  ui?: EhAppWidgetUiCredsOne | EhAppWidgetUiCredsMany;
  db?: EhAppWidgetDbCreds;
}

export type EhAppMeta = Record<string, string>;

/**
 * Hint for the user what the username and password are.
 */
export interface EhAppWidgetUiCredsOne {
  label?: string;
  desc?: string;
  username: string;
  password: string;
}

export type EhAppWidgetUiCredsMany = EhAppWidgetUiCredsOne[];

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
  widgetTitle?: string;
  widgetUrl?: string;
  widgetSvg?: string;
  icons?: EhIcon[];
  appLinkTypes: AppLinkType[];
}

export interface AppLinkType {
  typeId: string;
  iconId?: string;
  urlDecoded: string;
  title: string;
}

export interface EhIcon {
  iconId: string;
  svg: string;
}

export interface EhCustomization extends EhCustomPartUnstable {
  footerHtml: string;
  analyticsScript: string;
}

export interface EhStatJump {
  date: string;
  envId: EhEnvId;
  appId: EhAppId;
  sub?: string;
}
