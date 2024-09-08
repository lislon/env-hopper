import { EhApp, EhEnv } from '@env-hopper/types';
import { EhSubstitutionValue } from '../types';

export function findSubstitutionIdByUrl({
  app,
  env,
}: {
  app: EhApp | undefined;
  env: EhEnv | undefined;
}) {
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

export function normalizeExternalAppName(appName: string) {
  if (appName.indexOf('/') === -1) {
    appName = appName + '/home';
  }
  return appName;
}
