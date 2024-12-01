'use client';
import {
  EhApp,
  EhAppId,
  EhClientConfig,
  EhEnv,
  EhEnvId,
  EhSubstitutionType,
} from '@env-hopper/types';
import React, { createContext, useCallback, useContext } from 'react';
import { EhJumpHistory, EhJumpParams, EhSubstitutionValue } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { findSubstitutionIdByUrl, getJumpUrl } from '../lib/utils';
import { MAX_HISTORY_JUMPS } from '../lib/constants';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { apiPostStatsJump } from '../api/apiPostStatsJump';
import { ApiQueryMagazine } from '../api/ApiQueryMagazine';
import {
  LOCAL_STORAGE_KEY_FAVORITE_APPS,
  LOCAL_STORAGE_KEY_FAVORITE_ENVS,
  LOCAL_STORAGE_KEY_RECENT_JUMPS,
  LOCAL_STORAGE_KEY_USER_ID,
  LOCAL_STORAGE_KEY_WATCHED_TUTORIAL,
} from '../lib/local-storage-constants';

export interface EhContextProps {
  listEnvs: EhEnv[];
  listApps: EhApp[];
  listSubstitutions: EhSubstitutionType[];
  listFavoriteEnvs: EhEnvId[];
  listFavoriteApps: EhAppId[];
  toggleFavoriteEnv: (envId: EhEnvId, isOn: boolean) => void;
  toggleFavoriteApp: (appId: EhAppId, isOn: boolean) => void;

  getAppById(id: EhAppId | undefined): EhApp | undefined;
  getEnvById(id: EhEnvId | undefined): EhEnv | undefined;

  getSubstitutionValueById(
    envId: EhEnvId | undefined,
    appId: EhAppId | undefined,
    substitution: string | undefined,
  ): EhSubstitutionValue | undefined;

  recordJump(jump: EhJumpParams): void;

  // add params?
  // tryJump(): void;

  // most recent in the beginning
  recentJumps: EhJumpHistory[];
  hadWatchedInitialTutorial: boolean;
  setHadWatchedInitialTutorial: (yesOrNo: boolean) => void;
  config: EhClientConfig;
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

export function doGetAppById(id: string | undefined, ehApps: EhApp[]) {
  return ehApps.find((app) => app.id === id) || undefined;
}

export function doGetEnvById(id: string | undefined, ehEnvs: EhEnv[]) {
  return ehEnvs.find((env) => env.id === id) || undefined;
}

export interface EhContextProviderProps {
  children: React.ReactNode;
}

export function EhGeneralContextProvider({ children }: EhContextProviderProps) {
  const { data: config } = useSuspenseQuery(ApiQueryMagazine.getConfig());

  useLocalStorage<string | undefined>(LOCAL_STORAGE_KEY_USER_ID, () =>
    crypto.randomUUID(),
  );

  const mutationJump = useMutation({
    mutationFn: apiPostStatsJump,
  });

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

  const listEnvs = config.envs;
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

      mutationJump.mutate({
        appId: app?.id || '',
        envId: env?.id || '',
        sub: substitution?.value,
        date: new Date().toISOString(),
      });
    },
    [getJumpUrl, setRecentJumps],
  );

  const value: EhContextProps = {
    listFavoriteEnvs,
    listFavoriteApps,
    listEnvs: listEnvs,
    listApps: listApps,
    listSubstitutions: config.substitutions,
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
    recentJumps,
    hadWatchedInitialTutorial,
    setHadWatchedInitialTutorial,
    config,
  };

  return <EhContext.Provider value={value}>{children}</EhContext.Provider>;
}
