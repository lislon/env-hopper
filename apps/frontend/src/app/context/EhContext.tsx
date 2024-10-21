'use client';
import {
  EhApp,
  EhAppId,
  EhClientConfig,
  EhEnv,
  EhEnvId,
  EhLastUsedSubs,
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
import {
  ComboBoxType,
  EhJumpHistory,
  EhJumpParams,
  EhSubstitutionValue,
} from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  cutApp,
  cutDomain,
  findSubstitutionIdByUrl,
  formatAppTitle,
  getAppIdByTitle,
  getEhUrl,
  getJumpUrl,
  getJumpUrlEvenNotComplete,
} from '../lib/utils';
import { Params, useNavigate, useParams } from 'react-router-dom';
import { makeAutoCompleteFilter } from '../lib/autoComplete/autoCompleteFilter';
import { Item } from '../ui/AutoComplete/common';
import { usePrefetch } from '../hooks/usePrefetch';
import { FocusControllerEh, useFocusController } from '../lib/focusController';
import { MAX_HISTORY_JUMPS } from '../lib/constants';
import { omit } from 'lodash';

export const LOCAL_STORAGE_KEY_RECENT_JUMPS = 'recent';
export const LOCAL_STORAGE_KEY_FAVORITE_ENVS = 'favoriteEnvs';
export const LOCAL_STORAGE_KEY_FAVORITE_APPS = 'favoriteApps';
export const LOCAL_STORAGE_KEY_VERSION = 'version';
export const LOCAL_STORAGE_KEY_WATCHED_TUTORIAL = 'hadWatchedTutorial';
export const LOCAL_STORAGE_KEY_LAST_USED_ENV = 'lastUsedEnv';
export const LOCAL_STORAGE_KEY_LAST_USED_APP = 'lastUsedApp';
export const LOCAL_STORAGE_KEY_LAST_USED_SUBS = 'lastUsedSubs';

export interface EhContextProps extends FocusControllerEh {
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

  // most recent in the beginning
  recentJumps: EhJumpHistory[];
  reset: () => void;
  domainPart: string;
  appPart: string;
  hadWatchedInitialTutorial: boolean;
  setHadWatchedInitialTutorial: (yesOrNo: boolean) => void;
  highlightAutoComplete: ComboBoxType | undefined;
  setHighlightAutoComplete: (highlight: ComboBoxType | undefined) => void;
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

function doGetAppById(id: string | undefined, ehApps: EhApp[]) {
  return ehApps.find((app) => app.id === id) || undefined;
}

function doGetEnvById(id: string | undefined, ehEnvs: EhEnv[]) {
  return ehEnvs.find((env) => env.id === id) || undefined;
}

export function unescapeAppId(appIdFromUrl: string) {
  return getAppIdByTitle(appIdFromUrl.replace('@', '/'));
}

function getByIdRelaxed<T extends { id: string }>(
  primarySearch: (id: string | undefined, ehEnvs: T[]) => T | undefined,
  id: string | undefined,
  options: T[],
): [T | undefined, boolean] {
  if (id !== undefined) {
    const exactMatchResult = primarySearch(id, options);
    if (exactMatchResult !== undefined) {
      return [exactMatchResult, true];
    }

    const items: Item[] = options.map((e) => ({ title: e.id, id: e.id }));
    const found = makeAutoCompleteFilter(items)(id.toLowerCase(), items);
    if (found.length === 1) {
      return [primarySearch(found[0].id, options), false];
    }
  }
  return [undefined, false];
}

export interface PreselectedBasedOnParams {
  routerParams: Readonly<Params<string>>;
  config: EhClientConfig;
  lastUsedEnv: EhEnvId | undefined;
  lastUsedApp: EhAppId | undefined;
  lastUsedSubs: EhLastUsedSubs | undefined;
}

export interface PreselectedBasedOnParamsReturn {
  urlWasFixed: boolean;
  env: EhEnv | undefined;
  app: EhApp | undefined;
  substitution: EhSubstitutionValue | undefined;
}

function getSubstitutionBasedOnAppAndLastUsed(
  app: EhApp | undefined,
  listEnvs: EhEnv[],
  lastUsedSubs: EhLastUsedSubs | undefined,
): EhSubstitutionValue | undefined {
  const subId = findSubstitutionIdByUrl({
    app,
    env: listEnvs?.[0],
  });
  if (subId && lastUsedSubs?.[subId] !== undefined) {
    return {
      name: subId,
      value: lastUsedSubs[subId],
    };
  }
  return undefined;
}

function getPreselectedBasedOnParams({
  routerParams,
  config,
  lastUsedEnv,
  lastUsedApp,
  lastUsedSubs,
}: PreselectedBasedOnParams): PreselectedBasedOnParamsReturn {
  let env: EhEnv | undefined = undefined;
  let app: EhApp | undefined = undefined;
  let sub = undefined;
  let urlWasFixed = false;
  const listEnvs = config.envs;

  if ('envId' in routerParams) {
    let strictMatch;
    [env, strictMatch] = getByIdRelaxed<EhEnv>(
      doGetEnvById,
      routerParams['envId'],
      config.envs,
    );
    if (!strictMatch) {
      urlWasFixed = true;
    }
  } else if (lastUsedEnv !== undefined) {
    [env] = getByIdRelaxed(doGetEnvById, lastUsedEnv, config.envs);
  }

  if ('appId' in routerParams) {
    let strictMatch;
    [app, strictMatch] = getByIdRelaxed<EhApp>(
      doGetAppById,
      routerParams['appId'] !== undefined
        ? unescapeAppId(routerParams['appId'])
        : undefined,
      config.apps,
    );
    if (!strictMatch) {
      urlWasFixed = true;
    }
  } else if (lastUsedApp !== undefined) {
    [app] = getByIdRelaxed(doGetAppById, lastUsedApp, config.apps);
  }

  if ('subValue' in routerParams && routerParams['subValue'] !== undefined) {
    const subName = findSubstitutionIdByUrl({ app, env });
    if (subName !== undefined) {
      sub = {
        name: subName,
        value: routerParams['subValue'],
      };
    }
  } else if (lastUsedSubs !== undefined) {
    sub = getSubstitutionBasedOnAppAndLastUsed(app, listEnvs, lastUsedSubs);
  }

  return { urlWasFixed, env, app, substitution: sub };
}

export function EhContextProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: EhClientConfig;
  error: Error | null;
}) {
  const navigate = useNavigate();
  const routerParams = useParams();
  const [lastUsedApp, setLastUsedApp] = useLocalStorage<EhAppId | undefined>(
    LOCAL_STORAGE_KEY_LAST_USED_APP,
    undefined,
  );
  const [lastUsedEnv, setLastUsedEnv] = useLocalStorage<EhEnvId | undefined>(
    LOCAL_STORAGE_KEY_LAST_USED_ENV,
    undefined,
  );
  const [lastUsedSubs, setLastUsedSubs] = useLocalStorage<
    EhLastUsedSubs | undefined
  >(LOCAL_STORAGE_KEY_LAST_USED_SUBS, undefined);

  const [initialEnvAppSubBased] = useState(() => {
    return getPreselectedBasedOnParams({
      routerParams,
      config,
      lastUsedApp,
      lastUsedSubs,
      lastUsedEnv,
    });
  });

  const [env, setEnv] = useState<EhEnv | undefined>(initialEnvAppSubBased.env);
  const [app, setApp] = useState<EhApp | undefined>(initialEnvAppSubBased.app);
  const [substitution, setSubstitution] = useState<
    EhSubstitutionValue | undefined
  >(initialEnvAppSubBased.substitution);

  const fixUrlBasedOnSelection = useCallback(
    (
      envId: EhEnvId | undefined,
      appId: EhAppId | undefined,
      substitution: string | undefined,
      replace = false,
    ) => {
      const url = getEhUrl(envId, appId, substitution);
      navigate(url, {
        replace,
      });
    },
    [navigate],
  );

  useEffect(() => {
    const { app, env, substitution, urlWasFixed } = getPreselectedBasedOnParams(
      {
        routerParams,
        config,
        lastUsedApp,
        lastUsedSubs,
        lastUsedEnv,
      },
    );

    if (urlWasFixed) {
      fixUrlBasedOnSelection(env?.id, app?.id, substitution?.value, true);
      return;
    }

    setEnv(env);
    setApp(app);
    console.log('setSubstitution url', substitution);
    setSubstitution(substitution);
  }, [config, routerParams, fixUrlBasedOnSelection]);

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

  const [hadWatchedInitialTutorial, setHadWatchedInitialTutorial] =
    useLocalStorage<boolean>(LOCAL_STORAGE_KEY_WATCHED_TUTORIAL, false);

  const [, setVersion] = useLocalStorage<string>(LOCAL_STORAGE_KEY_VERSION, '');
  useEffect(() => {
    setVersion(import.meta.env.VITE_APP_VERSION);
  }, [setVersion]);

  useEffect(() => {
    if (app && env) {
      document.title = `${env.id} - ${formatAppTitle(app)} - Env Hopper`;
    } else if (app) {
      document.title = `${formatAppTitle(app)} - Env Hopper`;
    } else if (env) {
      document.title = `${env.id} - Env Hopper`;
    } else {
      document.title = `Env Hopper`;
    }
  }, [env, app]);

  const prefetch = usePrefetch();
  useEffect(() => {
    const jumpUrl = getJumpUrl({ app, env, substitution });
    if (jumpUrl !== undefined) {
      prefetch(jumpUrl);
    }
  }, [app, env, prefetch, substitution]);

  const listEnvs = config.envs;
  const substitutionName = useMemo(
    () =>
      findSubstitutionIdByUrl({
        app,
        env: listEnvs?.[0],
      }),
    [app, listEnvs],
  );

  const substitutionType = useMemo(
    () =>
      config.substitutions.find((s) => s.id === substitutionName || undefined),
    [config.substitutions, substitutionName],
  );

  const { focusControllerEnv, focusControllerSub, focusControllerApp } =
    useFocusController({
      app,
      env,
      substitutionType,
    });

  const listApps = config.apps;

  const getAppById = useCallback(
    (id: EhAppId) => {
      return doGetAppById(id, listApps);
    },
    [listApps],
  );

  const getEnvById = useCallback(
    (id: EhEnvId) => {
      return doGetEnvById(id, listEnvs);
    },
    [listApps],
  );

  const [highlightAutoComplete, setHighlightAutoComplete] = useState<
    ComboBoxType | undefined
  >();

  const firstApp = app ? app : listApps.length > 0 ? listApps[0] : undefined;
  const firstEnv = env ? env : listEnvs.length > 0 ? listEnvs[0] : undefined;
  const incompleteUrl =
    firstApp &&
    getJumpUrlEvenNotComplete({
      app: firstApp,
      env: firstEnv,
      substitution: substitution,
    });

  const domainPart = cutDomain(incompleteUrl || 'https://no-env');
  const appPart = cutApp(incompleteUrl || 'https://no-env/no-app');

  const recordJump = useCallback<EhContextProps['recordJump']>(
    ({ app, env, substitution }) => {
      const jumpUrl = getJumpUrl({
        app: app,
        env: env,
        substitution: substitution,
      });
      if (jumpUrl === undefined) {
        return;
      }
      const newJump: EhJumpHistory = {
        app: app?.id,
        env: env?.id,
        substitution: substitution?.value,
        url: jumpUrl,
      };
      setRecentJumps((old) => {
        return [newJump, ...old.filter((h) => h.url !== jumpUrl)].slice(
          0,
          MAX_HISTORY_JUMPS,
        );
      });
    },
    [getJumpUrl, setRecentJumps],
  );

  const value: EhContextProps = {
    setEnv: useCallback<EhContextProps['setEnv']>(
      (env) => {
        setEnv(env);
        setLastUsedEnv(env?.id);
      },
      [setEnv, setLastUsedEnv],
    ),
    env,
    listFavoriteEnvs,
    listFavoriteApps,
    setApp: useCallback<EhContextProps['setApp']>(
      (app) => {
        setApp(app);
        setLastUsedApp(app?.id);
        const substitutionBasedOnAppAndLastUsed =
          getSubstitutionBasedOnAppAndLastUsed(app, listEnvs, lastUsedSubs);
        setSubstitution(substitutionBasedOnAppAndLastUsed);
      },
      [setApp, setLastUsedApp, lastUsedSubs, listEnvs],
    ),
    app,
    substitutionType,
    listEnvs: listEnvs,
    listApps: listApps,
    listSubstitutions: config.substitutions,
    substitution,
    setSubstitution: useCallback<EhContextProps['setSubstitution']>(
      (substitution) => {
        console.log('setSubstitution user', substitution);
        setSubstitution(substitution);
        if (substitution?.name) {
          setLastUsedSubs((prev) => {
            if (substitution.value === '') {
              return prev ? omit(prev, substitution.name) : undefined;
            }
            return {
              ...prev,
              [substitution.name]: substitution.value,
            };
          });
        }
      },
      [],
    ),
    highlightAutoComplete,
    setHighlightAutoComplete: useCallback<
      EhContextProps['setHighlightAutoComplete']
    >((highlight) => {
      setHighlightAutoComplete(highlight);
    }, []),
    getAppById,
    getEnvById,
    recordJump,
    toggleFavoriteEnv: useCallback<EhContextProps['toggleFavoriteEnv']>(
      (envId, isOn) => {
        setFavoriteEnvIds((old) => {
          return [
            ...(isOn ? [envId] : []),
            ...old.filter((id) => id !== envId),
          ];
        });
      },
      [setFavoriteAppIds],
    ),
    toggleFavoriteApp: useCallback<EhContextProps['toggleFavoriteApp']>(
      (appId, isOn) => {
        setFavoriteAppIds((old) => {
          return [
            ...(isOn ? [appId] : []),
            ...old.filter((id) => id !== appId),
          ];
        });
      },
      [setFavoriteAppIds],
    ),
    getSubstitutionValueById: useCallback<
      EhContextProps['getSubstitutionValueById']
    >(
      (envId, appId, substitution) => {
        const substitutionIdByUrl = findSubstitutionIdByUrl({
          env: doGetEnvById(envId, listEnvs),
          app: doGetAppById(appId, listApps),
        });
        if (substitutionIdByUrl !== undefined && substitution !== undefined) {
          return {
            name: substitutionIdByUrl,
            value: substitution,
          };
        }
        return undefined;
      },
      [findSubstitutionIdByUrl],
    ),
    tryJump: useCallback(() => {
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
    }, [getJumpUrl, recordJump, app, env, substitution]),
    reset: useCallback(() => {
      setEnv(undefined);
      setApp(undefined);
      setSubstitution(undefined);
      setRecentJumps([]);
    }, []),
    domainPart,
    appPart,
    recentJumps,
    hadWatchedInitialTutorial,
    setHadWatchedInitialTutorial,
    focusControllerEnv,
    focusControllerApp,
    focusControllerSub,
  };

  return <EhContext.Provider value={value}>{children}</EhContext.Provider>;
}
