import { EhApp, EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { EhJumpParams, EhSubstitutionValue } from '../types';

export function findSubstitutionIdByUrl({ app, env }: { app: EhApp | undefined; env: EhEnv | undefined }) {
  if (app === undefined) {
    return undefined;
  }
  const urlPattern = getJumpUrlEvenNotComplete({ app, env });
  const match = urlPattern.match(/{(.+)}/);
  return match ? match[1] : undefined;
}

export function findSubstitutionTypeInApp(app: EhApp | undefined, env: EhEnv | undefined, listSubstitutions: EhSubstitutionType[]): EhSubstitutionType | undefined {
  if (app) {
    const match = findSubstitutionIdByUrl({ app, env });
    if (match) {
      return listSubstitutions.find(v => v.name === match[1]) || undefined;
    }
  }
  return undefined;
}

export function getEnvSpecificAppUrl(app: EhApp, env: EhEnv | undefined) {
  if (env !== undefined && app.urlPerEnv[env.name] !== undefined) {
    return app.urlPerEnv[env.name];
  }
  return app.url;
}

export function jump(jump: EhJumpParams) {
  console.log('jump');
}

export interface JumpDataParams {
  env?: EhEnv;
  app?: EhApp;
  substitution?: EhSubstitutionValue;
}

export interface JumpDataParamsForce extends JumpDataParams {
  app: EhApp;
}

export function hasSubstitution(app: EhApp, env: EhEnv) {
  return replaceMetaSubstitutions(app.url, env).includes('{');
}

function replaceMetaSubstitutions(url: string, env: EhEnv) {
  Object.entries(env.meta).forEach(([key, value]) => {
    url = url.replace('{' + key + '}', value);
  });
  return url;
}

export function getJumpUrlEvenNotComplete({ app, env, substitution }: JumpDataParamsForce) {
  let url = app.url;
  if (env !== undefined) {
    url = replaceMetaSubstitutions(url, env);
  }

  if (substitution !== undefined && substitution.name.trim() !== '') {
    url = url.replace('{' + substitution.name + '}', substitution.value);
  }

  return url;
}

function isSubstitutionNotProvided(substitution: EhSubstitutionValue | undefined) {
  return substitution === undefined || substitution.name.trim() === '';
}

export function getJumpUrl({ app, env, substitution }: JumpDataParams) {
  if (app === undefined) {
    return undefined;
  }
  if (env === undefined) {
    return undefined;
  }
  if (isSubstitutionNotProvided(substitution) && hasSubstitution(app, env)) {
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
