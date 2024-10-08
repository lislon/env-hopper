'use client';
import {
  EhApp,
  EhAppId,
  EhClientConfig,
  EhEnv,
  EhEnvId,
  EhSubstitutionType,
} from '@env-hopper/types';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { EhJumpHistory, EhJumpParams, EhSubstitutionValue } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  cutApp,
  cutDomain,
  findSubstitutionIdByUrl,
  getJumpUrl,
  getJumpUrlEvenNotComplete,
  normalizeExternalAppName,
} from '../lib/utils';
import { Params, useNavigate, useParams } from 'react-router-dom';
import { makeAutoCompleteFilter } from '../lib/autoCompleteFilter';
import { Item } from '../ui/AutoComplete/common';

export const LOCAL_STORAGE_KEY_RECENT_JUMPS = 'recent';
export const LOCAL_STORAGE_KEY_FAVORITE_ENVS = 'favoriteEnvs';
export const LOCAL_STORAGE_KEY_FAVORITE_APPS = 'favoriteApps';
export const LOCAL_STORAGE_KEY_VERSION = 'version';

export interface EhContextProps {
  listEnvs: EhEnv[];
  listApps: EhApp[];
  listSubstitutions: EhSubstitutionType[];
  listFavoriteEnvs: EhEnvId[];
  listFavoriteApps: EhAppId[];
  toggleFavoriteEnv: (envId: EhEnvId, isOn: boolean) => void;
  toggleFavoriteApp: (appId: EhAppId, isOn: boolean) => void;
  setEnv: (env: EhEnv | undefined) => void;
  setApp: (app: EhApp | undefined) => void;
  setSubstitution: (substitution: EhSubstitutionValue | undefined) => void;
  env: EhEnv | undefined;
  app: EhApp | undefined;
  substitution: EhSubstitutionValue | undefined;
  substitutionType: EhSubstitutionType | undefined;
  customFooterHtml?: string;

  getAppById(id: EhAppId | undefined): EhApp | undefined;

  getEnvById(id: EhEnvId | undefined): EhEnv | undefined;

  getSubstitutionValueById(
    envId: EhEnvId | undefined,
    appId: EhAppId | undefined,
    substitution: string | undefined,
  ): EhSubstitutionValue | undefined;

  recordJump(jump: EhJumpParams): void;

  tryJump(): void;

  // latest - in the end
  recentJumps: EhJumpHistory[];
  reset: () => void;
  domainPart: string;
  appPart: string;
}

//  createContext is not supported in Server Components
const EhContext = createContext<EhContextProps | undefined>(undefined);

export function useEhContext(): EhContextProps {
  const ctx = useContext(EhContext);
  if (ctx === undefined) {
    throw new Error('EhContext is not provided');
  }
  return ctx;
}

const MAX_HISTORY_JUMPS = 100;

type RecordJumpParams = {
  app: EhApp | undefined;
  env: EhEnv | undefined;
  substitution: EhSubstitutionValue | undefined;
};

function getAppById(id: string | undefined, ehApps: EhApp[]) {
  return ehApps.find((app) => app.id === id) || undefined;
}

function getEnvById(id: string | undefined, ehEnvs: EhEnv[]) {
  return ehEnvs.find((env) => env.id === id) || undefined;
}

function escapeAppId(appId: string) {
  return encodeURIComponent(appId.replace(/\/home$/, '').replace('/', '@'));
}

function unescapeAppId(appIdFromUrl: string) {
  return normalizeExternalAppName(appIdFromUrl.replace('@', '/'));
}

function escapeSubValue(subValue: string) {
  return encodeURIComponent(subValue);
}

function escapeEnvId(envId: string) {
  return encodeURIComponent(envId);
}

function getByIdRelaxed<T extends { id: string }>(
  primarySearch: (id: string | undefined, ehEnvs: T[]) => T | undefined,
  id: string | undefined,
  options: T[],
): [T | undefined, boolean] {
  if (id !== undefined) {
    const stictMatch = primarySearch(id, options);
    if (stictMatch !== undefined) {
      return [stictMatch, true];
    }

    const items: Item[] = options.map((e) => ({ title: e.id, id: e.id }));
    const found = makeAutoCompleteFilter(items)(id.toLowerCase(), items);
    if (found.length === 1) {
      return [primarySearch(found[0].id, options), false];
    }
  }
  return [undefined, false];
}

function getUrlBasedOn(
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

export interface PreselectedBasedOnParamsReturn {
  urlWasFixed: boolean;
  env: EhEnv | undefined;
  app: EhApp | undefined;
  substitution: EhSubstitutionValue | undefined;
}

function getPreselectedBasedOnParams(
  routerParams: Readonly<Params<string>>,
  config: EhClientConfig,
): PreselectedBasedOnParamsReturn {
  let env = undefined,
    app = undefined,
    sub = undefined;
  let urlWasFixed = false;

  if ('envId' in routerParams) {
    let strictMatch;
    [env, strictMatch] = getByIdRelaxed<EhEnv>(
      getEnvById,
      routerParams['envId'],
      config.envs,
    );
    if (!strictMatch) {
      urlWasFixed = true;
    }
  }

  if ('appId' in routerParams) {
    let strictMatch;
    [app, strictMatch] = getByIdRelaxed<EhApp>(
      getAppById,
      routerParams['appId'] !== undefined
        ? unescapeAppId(routerParams['appId'])
        : undefined,
      config.apps,
    );
    if (!strictMatch) {
      urlWasFixed = true;
    }
  }

  if ('subValue' in routerParams && routerParams['subValue'] !== undefined) {
    const subName = findSubstitutionIdByUrl({ app, env });
    if (subName !== undefined) {
      sub = {
        name: subName,
        value: routerParams['subValue'],
      };
    }
  }

  return { urlWasFixed, env, app, substitution: sub };
}

export function EhContextProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: EhClientConfig;
}) {
  const navigate = useNavigate();
  const params = useParams();

  const [initialEnvAppSubBased] = useState(() => {
    return getPreselectedBasedOnParams(params, config);
  });

  const [env, setEnv] = useState<EhEnv | undefined>(initialEnvAppSubBased.env);
  const [app, setApp] = useState<EhApp | undefined>(initialEnvAppSubBased.app);
  const [substitution, setSubstitution] = useState<
    EhSubstitutionValue | undefined
  >(initialEnvAppSubBased.substitution);

  const jumpBasedOn = useCallback(
    (
      envId: EhEnvId | undefined,
      appId: EhAppId | undefined,
      substitution: string | undefined,
      replace = false,
    ) => {
      const url = getUrlBasedOn(envId, appId, substitution);
      navigate(url, {
        replace,
      });
    },
    [navigate],
  );

  const [recentJumps, setRecentJumps] = useLocalStorage<EhJumpHistory[]>(
    LOCAL_STORAGE_KEY_RECENT_JUMPS,
    [],
  );
  const [listFavoriteEnvs, setFavoriteEnvIds] = useLocalStorage<EhEnvId[]>(
    LOCAL_STORAGE_KEY_FAVORITE_ENVS,
    [],
  );
  const [listFavoriteApps, setFavoriteAppIds] = useLocalStorage<EhAppId[]>(
    LOCAL_STORAGE_KEY_FAVORITE_APPS,
    [],
  );
  const [, setVersion] = useLocalStorage<string>(LOCAL_STORAGE_KEY_VERSION, '');
  useEffect(() => {
    setVersion(APP_VERSION);
  }, [setVersion]);

  useEffect(() => {
    if (app && env) {
      document.title = `${env.id} - ${app.title} - Env Hopper`;
    } else if (app) {
      document.title = `${app.title} - Env Hopper`;
    } else if (env) {
      document.title = `${env.id} - Env Hopper`;
    } else {
      document.title = `Env Hopper`;
    }
  }, [env, app]);

  useEffect(() => {
    const { app, env, substitution, urlWasFixed } = getPreselectedBasedOnParams(
      params,
      config,
    );

    if (urlWasFixed) {
      jumpBasedOn(env?.id, app?.id, substitution?.value, true);
      return;
    }

    setEnv(env);
    setApp(app);
    setSubstitution(substitution);
  }, [config, params, jumpBasedOn]);

  const value = useMemo<EhContextProps>(() => {
    const substitutionName = findSubstitutionIdByUrl({
      app,
      env: config.envs?.[0],
    });

    const substitutionType = config.substitutions.find(
      (s) => s.id === substitutionName || undefined,
    );

    const firstApp = app
      ? app
      : config.apps.length > 0
        ? config.apps[0]
        : undefined;
    const firstEnv = env
      ? env
      : config.envs.length > 0
        ? config.envs[0]
        : undefined;
    const incompleteUrl =
      firstApp &&
      getJumpUrlEvenNotComplete({
        app: firstApp,
        env: firstEnv,
        substitution: substitution,
      });
    const domainPart = cutDomain(incompleteUrl || 'https://no-env');
    const appPart = cutApp(incompleteUrl || 'https://no-env/no-app');

    const recordJump = function ({
      app,
      env,
      substitution: substitution1,
    }: RecordJumpParams) {
      const jumpUrl = getJumpUrl({
        app: app,
        env: env,
        substitution: substitution,
      });
      if (jumpUrl === undefined) {
        return;
      }
      const newVar: EhJumpHistory = {
        app: app?.id,
        env: env?.id,
        substitution: substitution?.value,
        url: jumpUrl,
      };
      setRecentJumps(
        [newVar, ...recentJumps.filter((h) => h.url !== jumpUrl)].slice(
          0,
          MAX_HISTORY_JUMPS,
        ),
      );
    };

    return {
      setEnv: (newEnv) => {
        jumpBasedOn(newEnv?.id, app?.id, substitution?.value);
      },
      env,
      listFavoriteEnvs,
      listFavoriteApps,
      setApp: (newApp) => {
        jumpBasedOn(env?.id, newApp?.id, substitution?.value);
      },
      app,
      substitutionType,
      listEnvs: config.envs,
      listApps: config.apps,
      listSubstitutions: config.substitutions,
      substitution,
      setSubstitution: (newSubstitution) => {
        jumpBasedOn(env?.id, app?.id, newSubstitution?.value, true);
      },
      getAppById(id: EhAppId): EhApp | undefined {
        return getAppById(id, config.apps);
      },
      getEnvById(id: EhEnvId): EhEnv | undefined {
        return getEnvById(id, config.envs);
      },
      recordJump,
      toggleFavoriteEnv(envId, isOn) {
        const allExceptThis = listFavoriteEnvs.filter((id) => id !== envId);
        setFavoriteEnvIds([...allExceptThis, ...(isOn ? [envId] : [])]);
      },
      toggleFavoriteApp(appId, isOn) {
        const allExceptThis = listFavoriteApps.filter((id) => id !== appId);
        setFavoriteAppIds([...allExceptThis, ...(isOn ? [appId] : [])]);
      },
      getSubstitutionValueById(envId, appId, substitution) {
        const substitutionIdByUrl = findSubstitutionIdByUrl({
          env: getEnvById(envId, config.envs),
          app: getAppById(appId, config.apps),
        });
        if (substitutionIdByUrl !== undefined && substitution !== undefined) {
          return {
            name: substitutionIdByUrl,
            value: substitution,
          };
        }
        return undefined;
      },
      tryJump() {
        const jumpUrl = getJumpUrl({ app, env, substitution });
        if (!jumpUrl) {
          return undefined;
        }
        recordJump({
          app: app,
          env: env,
          substitution,
        });
        window.open(jumpUrl, '_blank')?.focus();
      },
      reset() {
        setEnv(undefined);
        setApp(undefined);
        setSubstitution(undefined);
        setRecentJumps([]);
      },
      domainPart,
      appPart,
      recentJumps,
    };
  }, [
    app,
    config.envs,
    config.substitutions,
    config.apps,
    env,
    substitution,
    listFavoriteEnvs,
    listFavoriteApps,
    recentJumps,
    setRecentJumps,
    jumpBasedOn,
    setFavoriteEnvIds,
    setFavoriteAppIds,
  ]);

  return <EhContext.Provider value={value}>{children}</EhContext.Provider>;
}
