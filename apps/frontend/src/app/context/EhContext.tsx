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
} from '../lib/utils';

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
    substitution: string | undefined
  ): EhSubstitutionValue | undefined;

  recordJump(jump: EhJumpParams): void;
  tryJump(): void;

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

export function EhContextProvider({
  children,
  data,
}: {
  children: React.ReactNode;
  data: EhClientConfig;
}) {
  const [env, setEnv] = useState<EhEnv | undefined>();
  const [app, setApp] = useState<EhApp | undefined>();
  const [substitution, setSubstitution] = useState<
    EhSubstitutionValue | undefined
  >();

  const [recentJumps, setRecentJumps] = useLocalStorage<EhJumpHistory[]>(
    LOCAL_STORAGE_KEY_RECENT_JUMPS,
    []
  );
  const [listFavoriteEnvs, setFavoriteEnvIds] = useLocalStorage<EhEnvId[]>(
    LOCAL_STORAGE_KEY_FAVORITE_ENVS,
    []
  );
  const [listFavoriteApps, setFavoriteAppIds] = useLocalStorage<EhAppId[]>(
    LOCAL_STORAGE_KEY_FAVORITE_APPS,
    []
  );
  const [, setVersion] = useLocalStorage<string>(LOCAL_STORAGE_KEY_VERSION, '');
  useEffect(() => {
    setVersion(APP_VERSION);
  }, [setVersion]);

  const value = useMemo<EhContextProps>(() => {
    const substitutionName = findSubstitutionIdByUrl({ app, env });

    const substitutionType = data.substitutions.find(
      (s) => s.id === substitutionName || undefined
    );

    const firstApp = app
      ? app
      : data.apps.length > 0
      ? data.apps[0]
      : undefined;
    const firstEnv = env
      ? env
      : data.envs.length > 0
      ? data.envs[0]
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
          MAX_HISTORY_JUMPS
        )
      );
    };
    return {
      setEnv: (env1) => {
        setEnv(data.envs.find((env) => env === env1) || undefined);
      },
      env,
      listFavoriteEnvs,
      listFavoriteApps,
      setApp,
      app,
      substitutionType,
      listEnvs: data.envs,
      listApps: data.apps,
      listSubstitutions: data.substitutions,
      substitution,
      setSubstitution,
      customFooterHtml: data.customFooterHtml,
      getAppById(id: EhAppId): EhApp | undefined {
        return getAppById(id, data.apps);
      },
      getEnvById(id: EhEnvId): EhEnv | undefined {
        return getEnvById(id, data.envs);
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
          env: getEnvById(envId, data.envs),
          app: getAppById(appId, data.apps),
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
    env,
    app,
    data,
    recentJumps,
    setRecentJumps,
    substitution,
    listFavoriteApps,
    listFavoriteEnvs,
    setFavoriteEnvIds,
    setFavoriteAppIds,
  ]);

  return <EhContext.Provider value={value}>{children}</EhContext.Provider>;
}
