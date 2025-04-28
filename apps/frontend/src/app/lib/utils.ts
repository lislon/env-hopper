import { EhApp, EhAppId, EhEnv, EhSubstitutionId } from '@env-hopper/types';
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

export function hasUnresolvedSubstitution(str: string) {
  return str.includes('{{');
}

export type EhAppForInterpolate = Pick<EhApp, 'meta'>;

export function interpolateWidgetStr(
  str: string,
  env: EhEnv | undefined,
  app: EhAppForInterpolate | undefined,
) {
  let result = str;
  let hasChanges = true;

  for (
    let outerIteration = 0;
    hasChanges && outerIteration < 10;
    outerIteration++
  ) {
    hasChanges = false;
    let start = result.indexOf('{{');

    for (let iteration = 0; start !== -1 && iteration < 10; iteration++) {
      const end = result.indexOf('}}', start + 2);
      if (end === -1) break; // Stop if there's no matching '}}'

      // Extract the placeholder key
      const betweenBraces = result.slice(start + 2, end);

      let placeholder = betweenBraces;
      let placeholderDefault = undefined;

      if (betweenBraces.indexOf('??') >= 0) {
        [placeholder, placeholderDefault] = betweenBraces.split(/\s*[?][?]\s*/);
      }

      // Resolve the value
      let replacement: string | undefined;
      if (placeholder.startsWith('env.meta.') && env?.meta) {
        const key = placeholder.replace('env.meta.', '');
        replacement = env.meta[key];
      } else if (placeholder === 'env.id' && env) {
        replacement = env.id;
      } else if (placeholder.startsWith('app.meta.') && app?.meta) {
        const key = placeholder.replace('app.meta.', '');
        replacement = app.meta[key];
      }

      if (replacement === undefined && placeholderDefault !== undefined) {
        replacement = placeholderDefault;
      }

      if (replacement !== undefined) {
        // Replace the placeholder with its value
        result = result.slice(0, start) + replacement + result.slice(end + 2);
        hasChanges = true; // Mark that a replacement occurred
      } else {
        // Leave the unresolved placeholder as it is
        start = end + 2;
      }

      // Look for the next '{{'
      start = result.indexOf('{{', start);
    }
  }

  return result;
}

export function getAppWithEnvOverrides(
  appOrig: EhApp | undefined,
  env: EhEnv | undefined,
) {
  if (appOrig && env?.appOverride?.meta !== undefined) {
    return {
      ...appOrig,
      meta: { ...appOrig.meta, ...env.appOverride.meta },
      widgets: { ...appOrig.widgets, ...env.appOverride.widgets },
    };
  }
  return appOrig;
}

export function getJumpUrlEvenNotComplete({
  app,
  env,
  substitution,
}: JumpDataParamsForce) {
  let url = app.url;
  if (env !== undefined) {
    url = interpolateWidgetStr(url, env, app);
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
    hasUnresolvedSubstitution(interpolateWidgetStr(app.url, env, app))
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

export function unescapeAppId(appIdFromUrl: string) {
  return getAppIdByTitle(appIdFromUrl.replace('@', '/'));
}

export interface SensitiveDataCtx {
  env: EhEnv | undefined;
}

export function isNeedMaskSensitiveData({ env }: SensitiveDataCtx) {
  return env?.envType === 'prod';
}

export function maskSensitiveDataIfNeeded<T extends string | undefined>(
  value: T,
  ctx: SensitiveDataCtx,
): T {
  if (isNeedMaskSensitiveData(ctx) && value !== undefined) {
    return '*masked*' as T;
  }
  return value;
}
