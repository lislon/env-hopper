import {
  EhApp,
  EhAppId,
  EhEnv,
  EhEnvId,
  EhSubstitutionId,
} from '@env-hopper/types';
import { EhSubstitutionValue } from '../types';
import { normalizeAppId } from '../integration-tests/__utils__/ui-toolbelt';

export function findSubstitutionIdByUrl({
  app,
  env,
}: {
  app: EhApp | undefined;
  env: EhEnv | undefined;
}): EhSubstitutionId | undefined {
  if (app === undefined) {
    return undefined;
  }
  const urlPattern = getJumpUrlEvenNotComplete({ app, env });
  const match = urlPattern.match(/{{(.+?)}}/);
  return match ? match[1] : undefined;
}

export interface JumpDataParams {
  env?: EhEnv;
  app?: EhApp;
  substitution?: EhSubstitutionValue;
}

export interface JumpDataParamsForce extends JumpDataParams {
  app: EhApp;
}

export function hasUnresolvedSubstitution(app: EhApp, env: EhEnv) {
  return replaceSubstitutionsFromMeta(app.url, env).includes('{{');
}

export function replaceSubstitutionsFromMeta(
  string: string,
  env: EhEnv | undefined,
) {
  if (env !== undefined) {
    Object.entries(env.meta).forEach(([key, value]) => {
      string = string.replace('{{' + key + '}}', value);
    });
  }
  return string;
}

export function getJumpUrlEvenNotComplete({
  app,
  env,
  substitution,
}: JumpDataParamsForce) {
  let url = app.url;
  if (env !== undefined) {
    url = replaceSubstitutionsFromMeta(url, env);
  }

  if (substitution !== undefined && substitution.name.trim() !== '') {
    url = url.replace('{{' + substitution.name + '}}', substitution.value);
  }

  return url;
}

function isSubstitutionNotProvided(
  substitution: EhSubstitutionValue | undefined,
) {
  return substitution === undefined || substitution.name.trim() === '';
}

export function getJumpUrl({ app, env, substitution }: JumpDataParams) {
  if (app === undefined) {
    return undefined;
  }
  if (env === undefined) {
    return undefined;
  }
  if (
    isSubstitutionNotProvided(substitution) &&
    hasUnresolvedSubstitution(app, env)
  ) {
    return undefined;
  }
  return getJumpUrlEvenNotComplete({ app, env, substitution });
}

export function cutDomain(fullUrl: string) {
  return fullUrl.split('/')[2];
}

export function cutApp(fullUrl: string) {
  return fullUrl.split('/').slice(3).join('/');
}

export function getAppIdByTitle(appName: string): EhAppId {
  return normalizeAppId(appName);
}

export function getEnvIdByTitle(envTitle: string) {
  return envTitle;
}

export function escapeAppId(appId: string) {
  return encodeURIComponent(appId.replace(/\/home$/, '').replace('/', '@'));
}

export function escapeSubValue(subValue: string) {
  return encodeURIComponent(subValue);
}

export function escapeEnvId(envId: string) {
  return encodeURIComponent(envId);
}

export function getEhUrl(
  envId: EhEnvId | undefined,
  appId: EhAppId | undefined,
  substitution: string | undefined,
) {
  const portions = [
    envId ? `env/${escapeEnvId(envId)}` : false,
    appId ? `app/${escapeAppId(appId)}` : false,
    substitution ? `sub/${escapeSubValue(substitution)}` : false,
  ].filter(Boolean);

  return '/' + portions.join('/');
}

export function formatAppTitle(app: EhApp | undefined) {
  if (app === undefined) {
    return '';
  }
  return [app.abbr, app.appTitle, app.pageTitle].filter(Boolean).join(' :: ');
}

export const seconds = (s: number) => s * 1000;
export const minutes = (m: number) => seconds(m * 60);
export const hours = (h: number) => minutes(h * 60);
export const days = (d: number) => hours(d * 24);
