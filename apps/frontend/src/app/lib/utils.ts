
// export function isAppHasVars(app: EhApp, urlVars: EhUrlVar[]) {


import { EhApp, EhAppId, EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { EhJumpParams, EhSubstitutionValue, WithRequired } from '../types';

export function findSubstitutionIdByUrl(url: string|undefined) {
  if (!url) {
    return undefined;
  }
  const urlPattern = url.replace('{env}', '');

  const match = urlPattern.match(/{(.+)}/);
  return match ? match[1] : undefined;
}

export function findSubstitutionTypeInApp(app: EhApp | undefined, listSubstitutions: EhSubstitutionType[]): EhSubstitutionType | undefined {
    if (app) {
      const match = findSubstitutionIdByUrl(app.url);
      if (match) {
            return listSubstitutions.find(v => v.name === match[1]) || undefined;
        }
    }
    return undefined;
}

export function getEnvSpecificAppUrl(app: EhApp, env: EhEnv|undefined) {
  if (env !== undefined && app.urlPerEnv[env.name] !== undefined) {
    return app.urlPerEnv[env.name]
  }
  return app.url;
}

export function jump(jump: EhJumpParams) {
  console.log('jump');
}

export interface JumpDataParams {
  env: EhEnv | undefined;
  app: EhApp | undefined;
  substitution: EhSubstitutionValue | undefined;
}

export interface JumpDataParamsForce extends JumpDataParams{
  app: EhApp;
}

export function hasSubstitution(app: EhApp) {
  return app.url.replace('{env}', '').includes('{');
}

export function getJumpUrlEvenNotComplete({ app, env, substitution }: JumpDataParamsForce) {
  let url = app.url;
  if (env !== undefined) {
    url = url.replace('{env}', env.name);
  }

  if (substitution !== undefined) {
    url = url.replace(substitution.name, substitution.value);
  }

  return url;
}

export function getJumpUrl({ app, env, substitution }: JumpDataParams) {
  if (app === undefined) {
    return undefined;
  }
  if (env === undefined) {
    return undefined;
  }
  if (substitution === undefined && hasSubstitution(app)) {
    return undefined;
  }
  return getJumpUrlEvenNotComplete({ app, env, substitution });
}

export function cutDomain(fullUrl: string) {
  return fullUrl.split('/')[2];
}
